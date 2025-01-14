import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	Directive,
	effect,
	EmbeddedViewRef,
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
import * as THREE from 'three';
import { getInstanceState, prepare } from './instance';
import { SPECIAL_INTERNAL_ADD_COMMENT_FLAG } from './renderer/constants';
import { injectStore, NGT_STORE } from './store';
import type { NgtComputeFunction, NgtEventManager, NgtSize, NgtState, NgtViewport } from './types';
import { is } from './utils/is';
import { omit, pick } from './utils/parameters';
import { signalState, SignalState } from './utils/signal-state';
import { updateCamera } from './utils/update';

@Directive({ selector: 'ng-template[portalContent]' })
export class NgtPortalContent {
	static ngTemplateContextGuard(_: NgtPortalContent, ctx: unknown): ctx is { injector: Injector } {
		return true;
	}

	constructor() {
		const { element } = inject(ViewContainerRef);
		const { element: parentComment } = inject(ViewContainerRef, { skipSelf: true });
		const commentNode = element.nativeElement;

		commentNode.data = 'portal-content-container';

		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG](parentComment.nativeElement);
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG];
		}
	}
}

export interface NgtPortalState extends Omit<NgtState, 'events'> {
	events: {
		enabled?: boolean;
		priority?: number;
		compute?: NgtComputeFunction;
		connected?: any;
	};
}

function mergeState(
	previousRoot: SignalState<NgtState>,
	store: SignalState<NgtState>,
	container: THREE.Object3D,
	pointer: THREE.Vector2,
	raycaster: THREE.Raycaster,
	events?: NgtPortalState['events'],
	size?: NgtSize,
) {
	const previousState = previousRoot.snapshot;
	const state = store.snapshot;

	let viewport: Omit<NgtViewport, 'dpr' | 'initialDpr'> | undefined = undefined;

	if (state.camera && size) {
		const camera = state.camera;
		// calculate the override viewport, if present
		viewport = previousState.viewport.getCurrentViewport(camera, new THREE.Vector3(), size);
		// update the portal camera, if it differs from the previous layer
		if (camera !== previousState.camera) updateCamera(camera, size);
	}

	return {
		// the intersect consists of the previous root state
		...previousState,
		...state,
		// portals have their own scene, which forms the root, a raycaster and a pointer
		scene: container as THREE.Scene,
		pointer,
		raycaster,
		// their previous root is the layer before it
		previousRoot,
		events: { ...previousState.events, ...state.events, ...events },
		size: { ...previousState.size, ...size },
		viewport: { ...previousState.viewport, ...viewport },
		// layers are allowed to override events
		setEvents: (events: Partial<NgtEventManager<any>>) =>
			store.update((state) => ({ ...state, events: { ...state.events, ...events } })),
	} as NgtState;
}

@Component({
	selector: 'ngt-portal',
	template: `
		<ng-container #anchor />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NGT_STORE,
			useFactory: (previousStore: SignalState<NgtState>) => {
				const store = signalState({} as NgtState);
				store.update(mergeState(previousStore, store, null!, new THREE.Vector2(), new THREE.Raycaster()));
				return store;
			},
			deps: [[new SkipSelf(), NGT_STORE]],
		},
	],
})
export class NgtPortal {
	container = input.required<THREE.Object3D>();
	state = input<Partial<NgtPortalState>>({});

	private contentRef = contentChild.required(NgtPortalContent, { read: TemplateRef });
	private anchorRef = viewChild.required('anchor', { read: ViewContainerRef });

	private previousStore = injectStore({ skipSelf: true });
	private portalStore = injectStore();
	private injector = inject(Injector);

	private size = pick(this.state, 'size');
	private events = pick(this.state, 'events');
	private restState = omit(this.state, ['size', 'events']);

	protected portalContentRendered = signal(false);

	private portalViewRef?: EmbeddedViewRef<unknown>;

	constructor() {
		effect(() => {
			let [container, prevState] = [this.container(), this.previousStore()];

			const [size, events, restState] = [untracked(this.size), untracked(this.events), untracked(this.restState)];

			if (!is.instance(container)) {
				container = prepare(container, this.portalStore, 'ngt-portal');
			}

			const instanceState = getInstanceState(container);
			if (instanceState && instanceState.store !== this.portalStore) {
				instanceState.store = this.portalStore;
			}

			this.portalStore.update(
				restState,
				mergeState(
					this.previousStore,
					this.portalStore,
					container,
					this.portalStore.snapshot.pointer,
					this.portalStore.snapshot.raycaster,
					events,
					size,
				),
			);

			if (this.portalViewRef) {
				this.portalViewRef.detectChanges();
				return;
			}

			this.portalViewRef = untracked(this.anchorRef).createEmbeddedView(
				untracked(this.contentRef),
				{ injector: this.injector },
				{ injector: this.injector },
			);
			this.portalViewRef.detectChanges();
			this.portalContentRendered.set(true);
		});
	}
}

export const NgtPortalDeclarations = [NgtPortal, NgtPortalContent] as const;

// import {
// 	afterNextRender,
// 	ChangeDetectionStrategy,
// 	Component,
// 	computed,
// 	contentChild,
// 	CUSTOM_ELEMENTS_SCHEMA,
// 	DestroyRef,
// 	Directive,
// 	effect,
// 	EmbeddedViewRef,
// 	inject,
// 	Injector,
// 	input,
// 	signal,
// 	TemplateRef,
// 	untracked,
// 	viewChild,
// 	ViewContainerRef,
// } from '@angular/core';
// import { Camera, Object3D, Raycaster, Scene, Vector2, Vector3 } from 'three';
// import { getLocalState, prepare } from './instance';
// import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer-old/constants';
// import { injectStore, provideStore } from './store';
// import { NgtComputeFunction, NgtSize, NgtState } from './types';
// import { is } from './utils/is';
// import { signalStore } from './utils/signal-store';
// import { updateCamera } from './utils/update';
//
// @Component({
// 	selector: 'ngt-portal-before-render',
// 	template: `
// 		<!-- Without an element that receives pointer events state.pointer will always be 0/0 -->
// 		<ngt-group (pointerover)="onPointerOver()" attach="none" />
// 	`,
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class NgtPortalBeforeRender {
// 	private portalStore = injectStore();
//
// 	renderPriority = input(1);
// 	parentScene = input.required<Scene>();
// 	parentCamera = input.required<Camera>();
//
// 	constructor() {
// 		effect((onCleanup) => {
// 			// track state
// 			const [renderPriority, { internal }] = [this.renderPriority(), this.portalStore.state()];
//
// 			let oldClean: boolean;
//
// 			const cleanup = internal.subscribe(
// 				({ gl, scene, camera }) => {
// 					const [parentScene, parentCamera] = [untracked(this.parentScene), untracked(this.parentCamera)];
// 					oldClean = gl.autoClear;
// 					if (renderPriority === 1) {
// 						// clear scene and render with default
// 						gl.autoClear = true;
// 						gl.render(parentScene, parentCamera);
// 					}
//
// 					// disable cleaning
// 					gl.autoClear = false;
// 					gl.clearDepth();
// 					gl.render(scene, camera);
// 					// restore
// 					gl.autoClear = oldClean;
// 				},
// 				renderPriority,
// 				this.portalStore,
// 			);
//
// 			onCleanup(() => cleanup());
// 		});
// 	}
//
// 	onPointerOver() {
// 		/* noop */
// 	}
// }
//
// @Directive({ selector: 'ng-template[portalContent]' })
// export class NgtPortalContent {
// 	constructor() {
// 		const { element: comment } = inject(ViewContainerRef);
// 		const { element: parentComment } = inject(ViewContainerRef, { skipSelf: true });
//
// 		const commentNode = comment.nativeElement;
// 		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
// 			commentNode[SPECIAL_INTERNAL_ADD_COMMENT](parentComment.nativeElement);
// 			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
// 		}
// 	}
//
// 	static ngTemplateContextGuard(_: NgtPortalContent, ctx: unknown): ctx is { container: Object3D; injector: Injector } {
// 		return true;
// 	}
// }
// // Keys that shouldn't be copied between stores
// export const privateKeys = [
// 	'setSize',
// 	'setFrameloop',
// 	'setDpr',
// 	'events',
// 	'setEvents',
// 	'invalidate',
// 	'advance',
// 	'size',
// 	'viewport',
// ] as const;
//
// export type NgtPortalPrivateKeys = (typeof privateKeys)[number];
//
// export type NgtPortalInjectableState = Partial<
// 	Omit<NgtState, NgtPortalPrivateKeys> & {
// 		events?: {
// 			enabled?: boolean;
// 			priority?: number;
// 			compute?: NgtComputeFunction;
// 			connected?: any;
// 		};
// 		size?: NgtSize;
// 	}
// >;
//
// @Component({
// 	selector: 'ngt-portal',
// 	template: `
// 		<ng-container #anchor />
//
// 		@if (shouldAutoRender()) {
// 			<ngt-portal-before-render
// 				[renderPriority]="autoRenderPriority()"
// 				[parentScene]="parentScene()"
// 				[parentCamera]="parentCamera()"
// 			/>
// 		}
// 	`,
// 	imports: [NgtPortalBeforeRender],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// 	providers: [provideStore(() => signalStore<NgtState>({}))],
// })
// export class NgtPortal {
// 	container = input.required<Object3D>();
// 	state = input<NgtPortalInjectableState>({});
//
// 	/**
// 	 * @decsription turn this on to enable "HUD" like rendering
// 	 */
// 	autoRender = input(false);
// 	autoRenderPriority = input(1);
//
// 	private portalContent = contentChild.required(NgtPortalContent, { read: TemplateRef });
// 	private portalAnchor = viewChild.required('anchor', { read: ViewContainerRef });
//
// 	private injector = inject(Injector);
// 	private portalStore = injectStore({ self: true });
// 	private parentStore = injectStore({ skipSelf: true });
// 	protected parentScene = this.parentStore.select('scene');
// 	protected parentCamera = this.parentStore.select('camera');
//
// 	private raycaster = new Raycaster();
// 	private pointer = new Vector2();
// 	private portalRendered = signal(false);
//
// 	protected shouldAutoRender = computed(() => this.portalRendered() && this.autoRender());
//
// 	private portalView?: EmbeddedViewRef<unknown>;
//
// 	constructor() {
// 		const parentState = this.parentStore.select();
//
// 		// NOTE: we run this in afterNextRender for inputs to resolve
// 		afterNextRender(() => {
// 			const previousState = this.parentStore.snapshot;
//
// 			const { events = {}, size = {}, ...rest } = this.state();
// 			let container = this.container();
//
// 			if (!is.instance(container)) {
// 				container = prepare(container, { store: this.portalStore });
// 			}
//
// 			const localState = getLocalState(container);
// 			if (localState && !localState.store) {
// 				localState.store = this.portalStore;
// 			}
//
// 			this.portalStore.update({
// 				...previousState,
// 				scene: container as Scene,
// 				raycaster: this.raycaster,
// 				pointer: this.pointer,
// 				events: { ...previousState.events, ...events },
// 				size: { ...previousState.size, ...size },
// 				previousRoot: this.parentStore,
// 				...rest,
// 				setEvents: (events) =>
// 					this.portalStore.update((state) => ({ ...state, events: { ...state.events, ...events } })),
// 			});
//
// 			effect(
// 				() => {
// 					const state = this.state();
// 					const _parentState = parentState();
//
// 					this.portalStore.update((prev) => this.inject(_parentState, prev, state, untracked(this.container)));
// 					if (this.portalView) {
// 						this.portalView.detectChanges();
// 						return;
// 					}
//
// 					this.portalView = untracked(this.portalAnchor).createEmbeddedView(
// 						untracked(this.portalContent),
// 						{ container: untracked(this.container), injector: this.injector },
// 						{ injector: this.injector },
// 					);
// 					this.portalView.detectChanges();
// 					this.portalRendered.set(true);
// 				},
// 				{ injector: this.injector },
// 			);
// 		});
//
// 		inject(DestroyRef).onDestroy(() => {
// 			this.portalView?.destroy();
// 		});
// 	}
//
// 	private inject(
// 		parentState: NgtState,
// 		portalState: NgtState,
// 		injectedState: NgtPortalInjectableState,
// 		container: Object3D,
// 	) {
// 		const { events = {}, size, ...rest } = injectedState;
// 		const intersect: Partial<NgtState> = { ...parentState }; // all prev state props
//
// 		Object.keys(parentState).forEach((key) => {
// 			if (
// 				privateKeys.includes(key as NgtPortalPrivateKeys) ||
// 				(parentState[key as keyof NgtState] !== portalState[key as keyof NgtState] &&
// 					portalState[key as keyof NgtState])
// 			) {
// 				delete intersect[key as keyof NgtState];
// 			}
// 		});
//
// 		let viewport = undefined;
// 		if (portalState && size) {
// 			const camera = portalState.camera;
// 			// Calculate the override viewport, if present
// 			viewport = parentState.viewport.getCurrentViewport(camera, new Vector3(), size);
// 			// Update the portal camera, if it differs from the previous layer
// 			if (camera !== parentState.camera) {
// 				updateCamera(camera, size);
// 			}
// 		}
//
// 		return {
// 			...intersect,
// 			scene: container as Scene,
// 			raycaster: this.raycaster,
// 			pointer: this.pointer,
// 			events: { ...parentState.events, ...(portalState.events || {}), ...(events || {}) },
// 			size: { ...parentState.size, ...(size || {}) },
// 			viewport: { ...parentState.viewport, ...(viewport || {}) },
// 			...rest,
// 		};
// 	}
// }
