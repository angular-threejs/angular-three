import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	Directive,
	ElementRef,
	inject,
	Injector,
	input,
	signal,
	SkipSelf,
	TemplateRef,
	untracked,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import { Camera, Object3D, Raycaster, Scene, Vector2, Vector3 } from 'three';
import { NgtEventManager } from './events';
import { prepare } from './instance';
import { injectNgtRef } from './ref';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer/constants';
import { injectNgtStore, NGT_STORE, type NgtSize, type NgtState } from './store';
import { injectBeforeRender } from './utils/before-render';
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
	container: ElementRef<Object3D> | Object3D;
	camera: ElementRef<Camera> | Camera;
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
		const pointer = new Vector2();
		const raycaster = new Raycaster();
		return signalStore<NgtState>(({ update }) => {
			return {
				...parentState,
				pointer,
				raycaster,
				previousRoot: parentStore,
				// Layers are allowed to override events
				setEvents: (events) => update((state) => ({ ...state, events: { ...state.events, ...events } })),
			};
		});
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

	renderPriority = input(1);
	parentScene = input.required<Scene>();
	parentCamera = input.required<Camera>();

	constructor() {
		afterNextRender(() => {
			let oldClear: boolean;
			injectBeforeRender(
				() => {
					const { gl, scene, camera } = this.portalStore.get();
					oldClear = gl.autoClear;
					if (this.renderPriority() === 1) {
						// clear scene and render with default
						gl.autoClear = true;
						gl.render(this.parentScene(), this.parentCamera());
					}
					// disable cleaning
					gl.autoClear = false;
					gl.clearDepth();
					gl.render(scene, camera);
					// restore
					gl.autoClear = oldClear;
				},
				{ priority: this.renderPriority(), injector: this.injector },
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
	container = input<ElementRef<Object3D> | Object3D>(injectNgtRef(prepare(new Scene())));
	camera = input<ElementRef<Camera> | Camera>();
	state = input<
		Partial<
			Omit<NgtState, PrivateKeys> & {
				events: Partial<Pick<NgtEventManager<any>, 'enabled' | 'priority' | 'compute' | 'connected'>>;
				size: NgtSize;
			}
		>
	>();

	autoRender = input(false);
	autoRenderPriority = input(1);

	portalContentTemplate = contentChild.required(NgtPortalContent, { read: TemplateRef });
	portalContentAnchor = viewChild.required('portalContentAnchor', { read: ViewContainerRef });

	private destroyRef = inject(DestroyRef);
	private autoEffect = injectAutoEffect();
	private parentStore = injectNgtStore({ skipSelf: true });
	private portalStore = injectNgtStore({ self: true });

	private portalRendered = signal(false);

	protected renderAutoBeforeRender = computed(() => this.portalRendered() && this.autoRender());
	protected parentScene = this.parentStore.get('scene');
	protected parentCamera = this.parentStore.get('camera');

	constructor() {
		afterNextRender(() => {
			const parentState = this.parentStore.snapshot;
			const [container, { events = {}, size = {}, ...rest } = {}] = [this.container(), this.state()];

			this.portalStore.update({
				scene: (is.ref(container) ? container.nativeElement : container) as Scene,
				events: { ...parentState.events, ...events },
				size: { ...parentState.size, ...size },
				...rest,
			});

			this.autoEffect(() => {
				const previous = this.parentStore.state();
				this.portalStore.update((state) => this.inject(previous, state));
			});

			untracked(() => {
				const portalView = this.portalContentAnchor().createEmbeddedView(this.portalContentTemplate());
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

		const container = untracked(this.container);
		const { size, events, ...restInputsState } = untracked(this.state) || {};

		let viewport = undefined;
		if (injectState && size) {
			const camera = injectState.camera;
			viewport = rootState.viewport.getCurrentViewport(camera, new Vector3(), size);
			if (camera !== rootState.camera) updateCamera(camera, size);
		}

		return {
			...intersect,
			scene: is.ref(container) ? container.nativeElement : container,
			previousRoot: this.parentStore,
			events: { ...rootState.events, ...(injectState?.events || {}), ...events },
			size: { ...rootState.size, ...size },
			viewport: { ...rootState.viewport, ...(viewport || {}) },
			...restInputsState,
		} as NgtState;
	}
}
