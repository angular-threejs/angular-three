import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	Directive,
	DOCUMENT,
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
	ViewContainerRef,
} from '@angular/core';
import * as THREE from 'three';
import { Group } from 'three';
import { getInstanceState, prepare } from './instance';
import { extend } from './renderer/catalogue';
import {
	createRendererNode,
	getRendererAnchor,
	isRendererNodeType,
	NgtRendererClassId,
	NgtRendererNode,
	setRendererAnchor,
} from './renderer/state';
import { attachThreeNodes, removeThreeChild } from './renderer/utils';
import { injectStore, NGT_STORE } from './store';
import type { NgtComputeFunction, NgtEventManager, NgtInstanceNode, NgtSize, NgtState, NgtViewport } from './types';
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
	static ngTemplateContextGuard(_: NgtPortalContent, _ctx: unknown): _ctx is { injector: Injector } {
		return true;
	}

	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef, { skipSelf: true });
		const { element } = inject(ViewContainerRef);
		const commentNode = element.nativeElement;
		const store = injectStore();
		const domParent = host.nativeElement as unknown as NgtRendererNode<'portal'>;
		const anchor = { kind: 'portal' as const, store, domParent };

		setRendererAnchor(commentNode, anchor);
		setRendererAnchor(domParent, anchor);
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
	previousState: NgtState,
	container: THREE.Object3D,
	runtime: PortalRuntime,
	restState: Omit<Partial<NgtPortalState>, 'size' | 'events'>,
	events?: NgtPortalState['events'],
	size?: NgtSize,
) {
	// The portal id belongs to this store. Everything else starts from the
	// latest parent snapshot so removed overrides cannot leave stale values.
	const { id: _, ...inheritedState } = previousState;
	const state = store.snapshot;
	capturePortalLocalState(previousState, state, runtime);
	const layeredState = { ...inheritedState, ...runtime.localState, ...restState };
	const camera = layeredState.camera;
	const mergedSize = { ...previousState.size, ...size };

	let viewport: Omit<NgtViewport, 'dpr' | 'initialDpr'> | undefined = undefined;

	if (camera && (camera !== previousState.camera || size)) {
		// calculate the override viewport, if present
		viewport = previousState.viewport.getCurrentViewport(camera, new THREE.Vector3(), mergedSize);
		// A portal-local camera owns its projection until the portal explicitly
		// overrides the inherited size. Camera components may intentionally provide
		// custom orthographic bounds or a custom perspective aspect.
		if (size && camera !== previousState.camera) updateCamera(camera, mergedSize);
	}

	runtime.inputEvents = events;

	const mergedState = {
		// Inherited values are refreshed on every effect run. Current input
		// overrides are applied over that fresh snapshot, never over stale portal
		// state from a previous run.
		...layeredState,
		id: state.id,
		// portals have their own scene, which forms the root, a raycaster and a pointer
		scene: container as THREE.Scene,
		pointer: runtime.pointer,
		raycaster: runtime.raycaster,
		// their previous root is the layer before it
		previousRoot,
		// The render loop and subscriptions are portal runtime state. Replacing
		// them with a new parent object would discard portal-local mutations.
		internal: state.internal,
		events: { ...previousState.events, ...runtime.localEvents, ...events },
		size: mergedSize,
		viewport: { ...previousState.viewport, ...viewport, ...restState.viewport },
		setEvents: runtime.setEvents,
		invalidate: runtime.invalidate,
	} as NgtState;
	runtime.lastMerged = mergedState;
	return mergedState;
}

type PortalLocalStateKey = 'camera' | 'controls';
type ManagedPortalContainer = THREE.Object3D & NgtInstanceNode & NgtRendererNode<'three'>;

interface PortalLocalStateTracker {
	baselines: Set<unknown>;
	values: unknown[];
}

function capturePortalLocalState(parent: NgtState, current: NgtState, runtime: PortalRuntime) {
	for (const key of ['camera', 'controls'] as const) {
		const tracker = runtime.localStateTrackers[key];
		tracker.baselines.add(parent[key]);
		const previousValue = runtime.lastMerged?.[key];
		const currentValue = current[key];
		if (!runtime.lastMerged || Object.is(currentValue, previousValue)) continue;

		if (tracker.baselines.has(currentValue)) {
			tracker.values.length = 0;
			delete runtime.localState[key];
			continue;
		}

		const restoredIndex = tracker.values.lastIndexOf(currentValue);
		if (restoredIndex >= 0) tracker.values.length = restoredIndex + 1;
		else tracker.values.push(currentValue);
		Object.assign(runtime.localState, { [key]: tracker.values.at(-1) });
	}
}

function movePortalChildren(
	store: SignalState<NgtState>,
	previousContainer: ManagedPortalContainer | undefined,
	nextContainer: ManagedPortalContainer,
) {
	if (!previousContainer || previousContainer === nextContainer) return;
	const previousState = getInstanceState(previousContainer);
	if (!previousState) return;
	const children = [...previousState.objects(), ...previousState.nonObjects()];
	for (const child of children) {
		const childState = getInstanceState(child);
		if (childState?.store !== store || childState.parent() !== previousContainer) continue;
		removeThreeChild(child, previousContainer, false);
		attachThreeNodes(nextContainer, child, undefined, store);
	}
}

interface PortalRuntime {
	pointer: THREE.Vector2;
	raycaster: THREE.Raycaster;
	localEvents: Partial<NgtEventManager<any>>;
	inputEvents?: NgtPortalState['events'];
	setEvents: (events: Partial<NgtEventManager<any>>) => void;
	invalidate: NgtState['invalidate'];
	invalidationListeners: Set<() => void>;
	lastMerged?: NgtState;
	localState: Partial<Pick<NgtState, PortalLocalStateKey>>;
	localStateTrackers: Record<PortalLocalStateKey, PortalLocalStateTracker>;
	container?: ManagedPortalContainer;
	containerClaim?: { container: ManagedPortalContainer; release: () => void };
}

const portalRuntimes = new WeakMap<SignalState<NgtState>, PortalRuntime>();

interface PortalContainerOwnership {
	baseline: SignalState<NgtState>;
	claims: Array<{ token: symbol; store: SignalState<NgtState> }>;
}

const portalContainerOwnership = new WeakMap<THREE.Object3D, PortalContainerOwnership>();

function claimPortalContainer(
	container: ManagedPortalContainer,
	store: SignalState<NgtState>,
	fallback: SignalState<NgtState>,
) {
	const instanceState = getInstanceState(container);
	if (!instanceState) return () => undefined;

	let ownership = portalContainerOwnership.get(container);
	if (!ownership) {
		ownership = { baseline: instanceState.store ?? fallback, claims: [] };
		portalContainerOwnership.set(container, ownership);
	}

	const token = Symbol('portal-container');
	ownership.claims.push({ token, store });
	instanceState.store = store;

	let active = true;
	return () => {
		if (!active) return;
		active = false;
		const current = portalContainerOwnership.get(container);
		if (!current) return;
		const index = current.claims.findIndex((claim) => claim.token === token);
		if (index >= 0) current.claims.splice(index, 1);
		const latest = current.claims.at(-1);
		instanceState.store = latest?.store ?? current.baseline;
		if (!latest) portalContainerOwnership.delete(container);
	};
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

				const runtime: PortalRuntime = {
					pointer,
					raycaster,
					localEvents: {},
					invalidate: () => undefined,
					invalidationListeners: new Set(),
					localState: {},
					localStateTrackers: {
						camera: { baselines: new Set(), values: [] },
						controls: { baselines: new Set(), values: [] },
					},
					setEvents: () => undefined,
				};
				runtime.setEvents = (events) => {
					Object.assign(runtime.localEvents, events);
					store.update((state) => ({
						events: { ...state.events, ...events, ...runtime.inputEvents },
					}));
				};
				runtime.invalidate = (frames) => {
					for (const listener of runtime.invalidationListeners) listener();
					previousStore.snapshot.invalidate(frames);
				};
				portalRuntimes.set(store, runtime);
				store.update(mergeState(previousStore, store, previousStore.snapshot, null!, runtime, {}));
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
	private document = inject(DOCUMENT);

	private size = pick(this.state, 'size');
	private events = pick(this.state, 'events');
	private restState = omit(this.state, ['size', 'events']);

	private portalContentRendered = signal(false);
	portalRendered = this.portalContentRendered.asReadonly();

	private portalViewRef?: EmbeddedViewRef<unknown>;

	/** @internal Subscribe to invalidations originating in this portal layer. */
	onInvalidate(listener: () => void) {
		const runtime = portalRuntimes.get(this.portalStore);
		if (!runtime) throw new Error('[NGT] Portal store runtime was not initialized');
		runtime.invalidationListeners.add(listener);
		return () => {
			runtime.invalidationListeners.delete(listener);
		};
	}

	constructor() {
		extend({ Group });

		effect(() => {
			// A makeDefault camera/controls update writes directly to the portal
			// store. Track those supported local overrides without tracking the
			// whole state object that this effect itself merges.
			this.portalStore.camera();
			this.portalStore.controls();
			const [inputContainer, anchor, content, previousState, size, events, restState] = [
				this.container(),
				this.anchorRef(),
				this.contentRef(),
				this.previousStore(),
				this.size(),
				this.events(),
				this.restState(),
			];
			const runtime = portalRuntimes.get(this.portalStore);
			if (!runtime) throw new Error('[NGT] Portal store runtime was not initialized');

			const instanceContainer = is.instance(inputContainer)
				? inputContainer
				: prepare(inputContainer, 'ngt-portal', { store: this.previousStore });
			const container: ManagedPortalContainer = isRendererNodeType(instanceContainer, 'three')
				? instanceContainer
				: createRendererNode('three', instanceContainer, this.document);

			const portalAnchor = getRendererAnchor(anchor.element.nativeElement);
			if (portalAnchor?.kind === 'portal' && portalAnchor.domParent) {
				portalAnchor.domParent.__ngt_renderer__[NgtRendererClassId.portalContainer] = container;
			}

			const instanceState = getInstanceState(container);
			if (instanceState && runtime.container !== container) {
				const nextRelease = claimPortalContainer(container, this.portalStore, this.previousStore);
				movePortalChildren(this.portalStore, runtime.container, container);
				runtime.containerClaim?.release();
				runtime.container = container;
				runtime.containerClaim = { container, release: nextRelease };
			}

			this.portalStore.update(
				mergeState(
					this.previousStore,
					this.portalStore,
					previousState,
					container,
					runtime,
					restState,
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

		inject(DestroyRef).onDestroy(() => {
			const runtime = portalRuntimes.get(this.portalStore);
			runtime?.containerClaim?.release();
			runtime?.invalidationListeners.clear();
			portalRuntimes.delete(this.portalStore);
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
