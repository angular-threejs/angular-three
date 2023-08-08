import { NgIf } from '@angular/common';
import {
	Component,
	ContentChild,
	DestroyRef,
	Directive,
	EventEmitter,
	Injector,
	Input,
	NgZone,
	Output,
	SkipSelf,
	TemplateRef,
	ViewChild,
	ViewContainerRef,
	effect,
	inject,
	type ElementRef,
	type EmbeddedViewRef,
	type OnInit,
} from '@angular/core';
import * as THREE from 'three';
import { injectBeforeRender } from './before-render';
import type { NgtEventManager } from './events';
import { getLocalState, prepare } from './instance';
import { injectNgtRef } from './ref';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer/constants';
import { NGT_STORE, NgtRenderState, injectNgtStore, type NgtSize, type NgtState } from './store';
import { is } from './utils/is';
import { safeDetectChanges } from './utils/safe-detect-changes';
import { signalStore } from './utils/signal-store';
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

@Directive({ selector: '[ngtPortalBeforeRender]', standalone: true })
export class NgtPortalBeforeRender implements OnInit {
	private portalStore = injectNgtStore();
	private injector = inject(Injector);

	@Input() renderPriority = 1;
	@Input({ required: true }) parentScene!: THREE.Scene;
	@Input({ required: true }) parentCamera!: THREE.Camera;

	@Output() beforeRender = new EventEmitter<NgtRenderState>();

	ngOnInit() {
		let oldClear: boolean;
		injectBeforeRender(
			({ delta, frame }) => {
				this.beforeRender.emit({ ...this.portalStore.get(), delta, frame });
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
			<ng-container
				*ngIf="autoRender && portalContentRendered"
				ngtPortalBeforeRender
				[renderPriority]="autoRenderPriority"
				[parentScene]="parentScene"
				[parentCamera]="parentCamera"
				(beforeRender)="onBeforeRender($event)"
			/>
		</ng-container>
	`,
	imports: [NgIf, NgtPortalBeforeRender],
	providers: [{ provide: NGT_STORE, useFactory: () => signalStore<NgtState>({}) }],
})
export class NgtPortal implements OnInit {
	private inputs = signalStore<NgtPortalInputs>({ container: injectNgtRef<THREE.Scene>(prepare(new THREE.Scene())) });

	@Input() set container(container: NgtPortalInputs['container']) {
		this.inputs.set({ container });
	}

	@Input('state') set portalState(state: NgtPortalInputs['state']) {
		this.inputs.set({ state });
	}

	@Input() autoRender = true;
	@Input() autoRenderPriority = 1;

	@Output() beforeRender = new EventEmitter<{ root: NgtRenderState; portal: NgtRenderState }>();

	@ContentChild(NgtPortalContent, { read: TemplateRef, static: true })
	portalContentTemplate!: TemplateRef<unknown>;

	@ViewChild('portalContentAnchor', { read: ViewContainerRef, static: true })
	portalContentAnchor!: ViewContainerRef;

	private parentStore = injectNgtStore({ skipSelf: true });
	parentScene = this.parentStore.get('scene');
	parentCamera = this.parentStore.get('camera');

	private portalStore = injectNgtStore({ self: true });
	private injector = inject(Injector);
	private zone = inject(NgZone);

	private raycaster = new THREE.Raycaster();
	private pointer = new THREE.Vector2();

	portalContentRendered = false;
	private portalContentView?: EmbeddedViewRef<unknown>;

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			if (this.portalContentView && !this.portalContentView.destroyed) {
				this.portalContentView.destroy();
			}
		});
	}

	ngOnInit() {
		const previousState = this.parentStore.get();
		const inputsState = this.inputs.get();

		if (!inputsState.state && this.autoRender) {
			inputsState.state = { events: { priority: this.autoRenderPriority + 1 } };
		}

		const { events, size, ...restInputsState } = inputsState.state || {};

		const containerState = inputsState.container;
		let container = is.ref(containerState) ? containerState.nativeElement : containerState;

		if (!is.instance(container)) {
			container = prepare(container);
		}

		const localState = getLocalState(container);
		if (!localState.store) {
			localState.store = this.portalStore;
		}

		this.portalStore.set({
			...previousState,
			scene: container as THREE.Scene,
			raycaster: this.raycaster,
			pointer: this.pointer,
			previousRoot: this.parentStore,
			events: { ...previousState.events, ...(events || {}) },
			size: { ...previousState.size, ...(size || {}) },
			...restInputsState,
			setEvents: (events) =>
				this.portalStore.set((state) => ({ ...state, events: { ...state.events, ...events } })),
		});

		const parentState = this.parentStore.select();
		effect(
			() => {
				const previous = parentState();
				this.zone.runOutsideAngular(() => {
					this.portalStore.set((state) => this.inject(previous, state));
				});
			},
			{ injector: this.injector },
		);

		requestAnimationFrame(() => {
			this.portalStore.set((injectState) => this.inject(this.parentStore.get(), injectState));
		});
		this.portalContentView = this.portalContentAnchor.createEmbeddedView(this.portalContentTemplate);
		safeDetectChanges(this.portalContentView);
		this.portalContentRendered = true;
	}

	onBeforeRender(portal: NgtRenderState) {
		this.beforeRender.emit({
			root: { ...this.parentStore.get(), delta: portal.delta, frame: portal.frame },
			portal,
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

		const inputs = this.inputs.get();
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
			raycaster: this.raycaster,
			pointer: this.pointer,
			previousRoot: this.parentStore,
			events: { ...rootState.events, ...(injectState?.events || {}), ...events },
			size: { ...rootState.size, ...size },
			viewport: { ...rootState.viewport, ...(viewport || {}) },
			...restInputsState,
		} as NgtState;
	}
}
