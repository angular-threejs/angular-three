import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ContentChild,
	DestroyRef,
	Directive,
	ElementRef,
	Injector,
	Input,
	SkipSelf,
	TemplateRef,
	ViewChild,
	ViewContainerRef,
	afterNextRender,
	computed,
	inject,
	untracked,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import * as THREE from 'three';
import type { NgtEventManager } from './events';
import { prepare } from './instance';
import { injectNgtRef } from './ref';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer/constants';
import { NGT_STORE, injectNgtStore, type NgtSize, type NgtState } from './store';
import { injectBeforeRender } from './utils/before-render';
import { cdAwareSignal } from './utils/cd-aware-signal';
import { is } from './utils/is';
import { signalStore, type NgtSignalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

const privateKeys = [
	'get',
	'set',
	'select',
	'setSize',
	'setDpr',
	'setFrameloop',
	'events',
	'invalidate',
	'advance',
	'size',
	'viewport',
] as const;
type PrivateKeys = (typeof privateKeys)[number];

export interface NgtPortalInputs {
	container: ElementRef<THREE.Object3D> | THREE.Object3D;
	camera: ElementRef<THREE.Camera> | THREE.Camera;
	state: Partial<
		Omit<NgtState, PrivateKeys> & {
			events: Partial<Pick<NgtEventManager<any>, 'enabled' | 'priority' | 'compute' | 'connected'>>;
			size: NgtSize;
		}
	>;
}

const [, providePortalStore] = createInjectionToken(
	(parentStore: NgtSignalStore<NgtState>) => {
		const parentState = parentStore.snapshot;
		const pointer = new THREE.Vector2();
		const raycaster = new THREE.Raycaster();
		const store = signalStore<NgtState>(({ update }) => {
			return {
				...parentState,
				pointer,
				raycaster,
				previousRoot: parentStore,
				// Layers are allowed to override events
				setEvents: (events) => update((state) => ({ ...state, events: { ...state.events, ...events } })),
			};
		});

		return store;
	},
	{ isRoot: false, token: NGT_STORE, deps: [[new SkipSelf(), NGT_STORE]] },
);

@Component({
	selector: 'ngt-portal-before-render',
	standalone: true,
	template: `
		<!-- Without an element that receives pointer events state.pointer will always be 0/0 -->
		<ngt-group (pointerover)="onPointerOver()" attach="none" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtPortalBeforeRender {
	private portalStore = injectNgtStore();
	private injector = inject(Injector);

	@Input() renderPriority = 1;
	@Input({ required: true }) parentScene!: THREE.Scene;
	@Input({ required: true }) parentCamera!: THREE.Camera;

	constructor() {
		afterNextRender(() => {
			let oldClear: boolean;
			injectBeforeRender(
				() => {
					const { gl, scene, camera } = this.portalStore.get();
					oldClear = gl.autoClear;
					if (this.renderPriority === 1) {
						// clear scene and render with default
						gl.autoClear = true;
						gl.render(this.parentScene, this.parentCamera);
					}
					// disable cleaning
					gl.autoClear = false;
					gl.clearDepth();
					gl.render(scene, camera);
					// restore
					gl.autoClear = oldClear;
				},
				{ priority: this.renderPriority, injector: this.injector },
			);
		});
	}

	onPointerOver() {
		/* noop */
	}
}

@Directive({ selector: 'ng-template[ngtPortalContent]', standalone: true })
export class NgtPortalContent {
	constructor(vcr: ViewContainerRef, @SkipSelf() parentVcr: ViewContainerRef) {
		const commentNode = vcr.element.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT](parentVcr.element.nativeElement);
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}
	}
}

@Component({
	selector: 'ngt-portal',
	standalone: true,
	template: `
		<ng-container #portalContentAnchor>
			@if (renderAutoBeforeRender()) {
				<ngt-portal-before-render
					[renderPriority]="autoRenderPriority"
					[parentScene]="parentScene"
					[parentCamera]="parentCamera"
				/>
			}
		</ng-container>
	`,
	imports: [NgtPortalBeforeRender],
	providers: [providePortalStore()],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtPortal {
	private portalInputs = signalStore<NgtPortalInputs>({
		container: injectNgtRef<THREE.Scene>(prepare(new THREE.Scene())),
	});

	@Input({ alias: 'options' }) set _portalInputs(value: Partial<NgtPortalInputs>) {
		this.portalInputs.update(value);
	}

	private autoRender = cdAwareSignal(false);
	@Input({ alias: 'autoRender' }) set _autoRender(value: boolean) {
		this.autoRender.set(value);
	}

	@Input() autoRenderPriority = 1;

	@ContentChild(NgtPortalContent, { read: TemplateRef, static: true })
	portalContentTemplate!: TemplateRef<unknown>;

	@ViewChild('portalContentAnchor', { read: ViewContainerRef, static: true })
	portalContentAnchor!: ViewContainerRef;

	private destroyRef = inject(DestroyRef);
	private autoEffect = injectAutoEffect();
	private parentStore = injectNgtStore({ skipSelf: true });
	private portalStore = injectNgtStore({ self: true });

	private portalRendered = cdAwareSignal(false);

	protected renderAutoBeforeRender = computed(() => this.portalRendered() && this.autoRender());
	protected parentScene = this.parentStore.get('scene');
	protected parentCamera = this.parentStore.get('camera');

	constructor() {
		afterNextRender(() => {
			const parentState = this.parentStore.snapshot;
			const {
				container,
				state: { events = {}, size = {}, ...rest },
			} = this.portalInputs.snapshot;

			this.portalStore.update({
				scene: (is.ref(container) ? container.nativeElement : container) as THREE.Scene,
				events: { ...parentState.events, ...events },
				size: { ...parentState.size, ...size },
				...rest,
			});

			this.autoEffect(() => {
				const previous = this.parentStore.state();
				this.portalStore.update((state) => this.inject(previous, state));
			});

			untracked(() => {
				const portalView = this.portalContentAnchor.createEmbeddedView(this.portalContentTemplate);
				portalView.detectChanges();
				this.destroyRef.onDestroy(portalView.destroy.bind(portalView));
			});

			this.portalRendered.set(true);
		});
	}

	private inject(rootState: NgtState, injectState: NgtState) {
		const intersect: Partial<NgtState> = { ...rootState };

		Object.keys(intersect).forEach((key) => {
			if (
				privateKeys.includes(key as PrivateKeys) ||
				rootState[key as keyof NgtState] !== injectState[key as keyof NgtState]
			) {
				delete intersect[key as keyof NgtState];
			}
		});

		const inputs = this.portalInputs.snapshot;
		const { size, events, ...restInputsState } = inputs.state || {};

		let viewport = undefined;
		if (injectState && size) {
			const camera = injectState.camera;
			viewport = rootState.viewport.getCurrentViewport(camera, new THREE.Vector3(), size);
			if (camera !== rootState.camera) updateCamera(camera, size);
		}

		return {
			...intersect,
			scene: is.ref(inputs.container) ? inputs.container.nativeElement : inputs.container,
			previousRoot: this.parentStore,
			events: { ...rootState.events, ...(injectState?.events || {}), ...events },
			size: { ...rootState.size, ...size },
			viewport: { ...rootState.viewport, ...(viewport || {}) },
			...restInputsState,
		} as NgtState;
	}
}
