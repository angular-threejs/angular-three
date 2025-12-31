import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	effect,
	ElementRef,
	EmbeddedViewRef,
	inject,
	Injector,
	input,
	numberAttribute,
	signal,
	SkipSelf,
	TemplateRef,
	untracked,
	ViewContainerRef,
} from '@angular/core';
import * as THREE from 'three';
import { Group } from 'three';
import { getInstanceState, prepare } from './instance';
import { extend } from './renderer/catalogue';
import { NGT_DOM_PARENT_FLAG, NGT_PORTAL_CONTENT_FLAG } from './renderer/constants';
import { injectStore, NGT_STORE } from './store';
import type { NgtComputeFunction, NgtEventManager, NgtSize, NgtState, NgtViewport } from './types';
import { is } from './utils/is';
import { makeId } from './utils/make';
import { omit, pick } from './utils/parameters';
import { signalState, SignalState } from './utils/signal-state';
import { updateCamera } from './utils/update';

/**
 * Directive to enable automatic rendering for portal content.
 *
 * When applied to an `ngt-portal`, this directive sets up automatic rendering
 * of the portal's scene on each frame. The render priority can be configured
 * to control the order of rendering relative to other subscriptions.
 *
 * @example
 * ```html
 * <ngt-portal [container]="container" [autoRender]="2">
 *   <ng-template portalContent>
 *     <ngt-mesh />
 *   </ng-template>
 * </ngt-portal>
 * ```
 */
@Directive({ selector: 'ngt-portal[autoRender]' })
export class NgtPortalAutoRender {
	private portalStore = injectStore({ host: true });
	private parentStore = injectStore({ skipSelf: true });
	private portal = inject(NgtPortalImpl, { host: true });

	renderPriority = input(1, { alias: 'autoRender', transform: (value) => numberAttribute(value, 1) });

	constructor() {
		// TODO: (chau) investigate if this is still needed
		// effect(() => {
		// this.portalStore.update((state) => ({ events: { ...state.events, priority: this.renderPriority() + 1 } }));
		// });

		effect((onCleanup) => {
			const portalRendered = this.portal.portalRendered();
			if (!portalRendered) return;

			// track state
			const [renderPriority, { internal }] = [this.renderPriority(), this.portalStore()];

			let oldClean: boolean;

			const cleanup = internal.subscribe(
				({ gl, scene, camera }) => {
					const [parentScene, parentCamera] = [
						this.parentStore.snapshot.scene,
						this.parentStore.snapshot.camera,
					];
					oldClean = gl.autoClear;
					if (renderPriority === 1) {
						// clear scene and render with default
						gl.autoClear = true;
						gl.render(parentScene, parentCamera);
					}

					// disable cleaning
					gl.autoClear = false;
					gl.clearDepth();
					gl.render(scene, camera);
					// restore
					gl.autoClear = oldClean;
				},
				renderPriority,
				this.portalStore,
			);

			onCleanup(() => cleanup());
		});
	}
}

/**
 * Structural directive for defining portal content.
 *
 * This directive marks the template content that will be rendered inside the portal.
 * It must be used inside an `ngt-portal` component.
 *
 * @example
 * ```html
 * <ngt-portal [container]="myGroup">
 *   <ng-template portalContent let-injector="injector">
 *     <ngt-mesh />
 *   </ng-template>
 * </ngt-portal>
 * ```
 */
@Directive({ selector: 'ng-template[portalContent]' })
export class NgtPortalContent {
	static ngTemplateContextGuard(_: NgtPortalContent, ctx: unknown): ctx is { injector: Injector } {
		return true;
	}

	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef, { skipSelf: true });
		const { element } = inject(ViewContainerRef);
		const commentNode = element.nativeElement;
		const store = injectStore();

		commentNode.data = NGT_PORTAL_CONTENT_FLAG;
		commentNode[NGT_PORTAL_CONTENT_FLAG] = store;
		commentNode[NGT_DOM_PARENT_FLAG] = host.nativeElement;
	}
}

/**
 * State interface for portal configuration.
 *
 * Extends the base NgtState with customizable event handling configuration.
 */
export interface NgtPortalState extends Omit<NgtState, 'events'> {
	/** Portal-specific event configuration */
	events: {
		/** Whether events are enabled for this portal */
		enabled?: boolean;
		/** Event handling priority */
		priority?: number;
		/** Custom compute function for raycasting */
		compute?: NgtComputeFunction;
		/** Connected event target */
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
	// we never want to spread the id
	const { id: _, ...previousState } = previousRoot.snapshot;
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

/**
 * Component for creating a portal to render Three.js content into a different container.
 *
 * Portals allow you to render content into a separate Three.js object while maintaining
 * the React-like declarative structure. Each portal has its own store with separate
 * raycaster and pointer state.
 *
 * @example
 * ```html
 * <ngt-group #portalContainer />
 *
 * <ngt-portal [container]="portalContainer">
 *   <ng-template portalContent>
 *     <ngt-mesh>
 *       <ngt-box-geometry />
 *     </ngt-mesh>
 *   </ng-template>
 * </ngt-portal>
 * ```
 */
@Component({
	selector: 'ngt-portal',
	template: `
		@if (portalRendered()) {
			<!-- Without an element that receives pointer events state.pointer will always be 0/0 -->
			<ngt-group (pointerover)="(undefined)" attach="none" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NGT_STORE,
			useFactory: (previousStore: SignalState<NgtState>) => {
				const pointer = new THREE.Vector2();
				const raycaster = new THREE.Raycaster();

				const { id: _skipId, ...previousState } = previousStore.snapshot;

				const store = signalState<NgtState>({
					id: makeId(),
					...previousState,
					scene: null as unknown as THREE.Scene,
					previousRoot: previousStore,
					pointer,
					raycaster,
				});
				store.update(mergeState(previousStore, store, null!, pointer, raycaster));
				return store;
			},
			deps: [[new SkipSelf(), NGT_STORE]],
		},
	],
})
export class NgtPortalImpl {
	container = input.required<THREE.Object3D>();
	state = input<Partial<NgtPortalState>>({});

	private contentRef = contentChild.required(NgtPortalContent, { read: TemplateRef });
	private anchorRef = contentChild.required(NgtPortalContent, { read: ViewContainerRef });

	private previousStore = injectStore({ skipSelf: true });
	private portalStore = injectStore();
	private injector = inject(Injector);

	private size = pick(this.state, 'size');
	private events = pick(this.state, 'events');
	private restState = omit(this.state, ['size', 'events']);

	private portalContentRendered = signal(false);
	portalRendered = this.portalContentRendered.asReadonly();

	private portalViewRef?: EmbeddedViewRef<unknown>;

	constructor() {
		extend({ Group });

		effect(() => {
			let [container, anchor, content] = [
				this.container(),
				this.anchorRef(),
				this.contentRef(),
				this.previousStore(),
			];

			const [size, events, restState] = [untracked(this.size), untracked(this.events), untracked(this.restState)];

			if (!is.instance(container)) {
				container = prepare(container, 'ngt-portal', { store: this.portalStore });
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

			const portalViewContext = { injector: this.injector };
			this.portalViewRef = anchor.createEmbeddedView(content, portalViewContext, portalViewContext);
			this.portalViewRef.detectChanges();
			this.portalContentRendered.set(true);
		});
	}
}

/**
 * Array containing NgtPortalImpl and NgtPortalContent for convenient importing.
 *
 * @example
 * ```typescript
 * @Component({
 *   imports: [NgtPortal],
 * })
 * export class MyComponent {}
 * ```
 */
export const NgtPortal = [NgtPortalImpl, NgtPortalContent] as const;
