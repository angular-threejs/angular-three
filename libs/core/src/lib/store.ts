import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectorRef,
	ElementRef,
	InjectionToken,
	Injector,
	Optional,
	SkipSelf,
	effect,
	inject,
	runInInjectionContext,
} from '@angular/core';
import { Subject, type Observable } from 'rxjs';
import * as THREE from 'three';
import type { NgtCamera, NgtDomEvent, NgtEventManager, NgtPointerCaptureTarget, NgtThreeEvent } from './events';
import type { NgtInstanceNode } from './instance';
import { NGT_LOOP, type NgtLoop } from './loop';
import { createInjectionToken } from './utils/create-injection-token';
import { is } from './utils/is';
import { makeDpr } from './utils/make';
import { safeDetectChanges } from './utils/safe-detect-changes';
import { signalStore, type NgtSignalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

export type NgtRenderer = { render: (scene: THREE.Scene, camera: THREE.Camera) => any };
export type NgtCameraManual = NgtCamera & { manual?: boolean };

export type NgtDpr = number | [min: number, max: number];
export type NgtSize = {
	width: number;
	height: number;
	top: number;
	left: number;
};

export type NgtViewport = NgtSize & {
	/** The initial pixel ratio */
	initialDpr: number;
	/** Current pixel ratio */
	dpr: number;
	/** size.width / viewport.width */
	factor: number;
	/** Camera distance */
	distance: number;
	/** Camera aspect ratio: width / height */
	aspect: number;
};

export type NgtPerformance = {
	/** Current performance normal, between min and max */
	current: number;
	/** How low the performance can go, between 0 and max */
	min: number;
	/** How high the performance can go, between min and max */
	max: number;
	/** Time until current returns to max in ms */
	debounce: number;
	/** Sets current to min, puts the system in regression */
	regress: () => void;
};

export type NgtRenderState = NgtState & { delta: number; frame?: XRFrame };

export type NgtBeforeRenderEvent<TObject extends NgtInstanceNode = NgtInstanceNode> = {
	state: NgtRenderState;
	object: TObject;
};

export type NgtBeforeRenderRecord = {
	callback: (state: NgtRenderState) => void;
	store: NgtSignalStore<NgtState>;
	priority?: number;
};

export type NgtInternalState = {
	active: boolean;
	priority: number;
	frames: number;
	lastEvent: ElementRef<NgtDomEvent | null>;
	interaction: THREE.Object3D[];
	hovered: Map<string, NgtThreeEvent<NgtDomEvent>>;
	capturedMap: Map<number, Map<THREE.Object3D, NgtPointerCaptureTarget>>;
	initialClick: [x: number, y: number];
	initialHits: THREE.Object3D[];
	subscribers: NgtBeforeRenderRecord[];
	subscribe: (
		callback: NgtBeforeRenderRecord['callback'],
		priority?: number,
		store?: NgtSignalStore<NgtState>,
	) => () => void;
};

export type NgtState = {
	/** when all building blocks are initialized */
	ready: boolean;
	/** The instance of the renderer */
	gl: THREE.WebGLRenderer;
	/** Default camera */
	camera: NgtCameraManual;
	/** Default scene */
	scene: THREE.Scene;
	/** Default raycaster */
	raycaster: THREE.Raycaster;
	/** Default clock */
	clock: THREE.Clock;
	/** Event layer interface, contains the event handler and the node they're connected to */
	events: NgtEventManager<any>;
	/** XR interface */
	xr: { connect: () => void; disconnect: () => void };
	/** Currently used controls */
	controls: THREE.EventDispatcher | null;
	/** Normalized event coordinates */
	pointer: THREE.Vector2;
	/* Whether to enable r139's THREE.ColorManagement */
	legacy: boolean;
	/** Shortcut to gl.outputColorSpace = THREE.LinearSRGBColorSpace */
	linear: boolean;
	/** Shortcut to gl.toneMapping = NoTonemapping */
	flat: boolean;
	/** Render loop flags */
	frameloop: 'always' | 'demand' | 'never';
	/** Adaptive performance interface */
	performance: NgtPerformance;
	/** Reactive pixel-size of the canvas */
	size: NgtSize;
	/** Reactive size of the viewport in threejs units */
	viewport: NgtViewport & {
		getCurrentViewport: (
			camera?: NgtCamera,
			target?: THREE.Vector3 | Parameters<THREE.Vector3['set']>,
			size?: NgtSize,
		) => Omit<NgtViewport, 'dpr' | 'initialDpr'>;
	};
	/** Flags the canvas for render, but doesn't render in itself */
	invalidate: (frames?: number) => void;
	/** Advance (render) one step */
	advance: (timestamp: number, runGlobalEffects?: boolean) => void;
	/** Shortcut to setting the event layer */
	setEvents: (events: Partial<NgtEventManager<any>>) => void;
	/**
	 * Shortcut to manual sizing
	 */
	setSize: (width: number, height: number, top?: number, left?: number) => void;
	/** Shortcut to manual setting the pixel ratio */
	setDpr: (dpr: NgtDpr) => void;
	/** Shortcut to frameloop flags */
	setFrameloop: (frameloop?: 'always' | 'demand' | 'never') => void;
	/** When the canvas was clicked but nothing was hit */
	/** PointerMissed Observable */
	pointerMissed$: Observable<MouseEvent>;
	/** If this state model is layerd (via createPortal) then this contains the previous layer */
	previousRoot: NgtSignalStore<NgtState> | null;
	/** Internals */
	internal: NgtInternalState;
};

function storeFactory(loop: NgtLoop, document: Document, injector: Injector, parent: NgtSignalStore<NgtState> | null) {
	return runInInjectionContext(injector, () => {
		const window = document.defaultView;

		if (!window) {
			// TODO: revisit this when we need to support multiple platforms
			throw new Error(`[NGT] Window is not available.`);
		}

		const cdr = inject(ChangeDetectorRef);

		// NOTE: using Subject because we do not care about late-subscribers
		const pointerMissed$ = new Subject<MouseEvent>();

		const store: NgtSignalStore<NgtState> = signalStore<NgtState>(({ get, set }) => {
			const { invalidate, advance } = loop;

			const position = new THREE.Vector3();
			const defaultTarget = new THREE.Vector3();
			const tempTarget = new THREE.Vector3();

			function getCurrentViewport(
				camera: NgtCamera = get('camera'),
				target: THREE.Vector3 | Parameters<THREE.Vector3['set']> = defaultTarget,
				size: NgtSize = get('size'),
			): Omit<NgtViewport, 'dpr' | 'initialDpr'> {
				const { width, height, top, left } = size;
				const aspect = width / height;
				if (target instanceof THREE.Vector3) tempTarget.copy(target);
				else tempTarget.set(...target);
				const distance = camera.getWorldPosition(position).distanceTo(tempTarget);
				if (is.orthographicCamera(camera)) {
					return {
						width: width / camera.zoom,
						height: height / camera.zoom,
						top,
						left,
						factor: 1,
						distance,
						aspect,
					};
				} else {
					const fov = (camera.fov * Math.PI) / 180; // convert vertical fov to radians
					const h = 2 * Math.tan(fov / 2) * distance; // visible height
					const w = h * (width / height);
					return { width: w, height: h, top, left, factor: width / w, distance, aspect };
				}
			}

			let performanceTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
			const setPerformanceCurrent = (current: number) =>
				set((state) => ({ performance: { ...state.performance, current } }));

			const pointer = new THREE.Vector2();

			return {
				pointerMissed$: pointerMissed$.asObservable(),
				events: { priority: 1, enabled: true, connected: false },

				invalidate: (frames = 1) => invalidate(store, frames),
				advance: (timestamp: number, runGlobalEffects?: boolean) => advance(timestamp, runGlobalEffects, store),

				legacy: false,
				linear: false,
				flat: false,

				controls: null,
				clock: new THREE.Clock(),
				pointer,

				frameloop: 'always',

				performance: {
					current: 1,
					min: 0.5,
					max: 1,
					debounce: 200,
					regress: () => {
						const state = get();
						// Clear timeout
						if (performanceTimeout) clearTimeout(performanceTimeout);
						// Set lower bound performance
						if (state.performance.current !== state.performance.min)
							setPerformanceCurrent(state.performance.min);

						// Go back to upper bound performance after a while unless something regresses meanwhile
						performanceTimeout = setTimeout(() => {
							setPerformanceCurrent(get('performance', 'max'));
							safeDetectChanges(cdr);
						}, state.performance.debounce);
					},
				},

				size: { width: 0, height: 0, top: 0, left: 0, updateStyle: false },
				viewport: {
					initialDpr: 0,
					dpr: 0,
					width: 0,
					height: 0,
					top: 0,
					left: 0,
					aspect: 0,
					distance: 0,
					factor: 0,
					getCurrentViewport,
				},

				setEvents: (events: Partial<NgtEventManager<any>>) =>
					set((state) => ({ ...state, events: { ...state.events, ...events } })),
				setSize: (width: number, height: number, top?: number, left?: number) => {
					const camera = get('camera');
					const size = { width, height, top: top || 0, left: left || 0 };
					set((state) => ({
						size,
						viewport: { ...state.viewport, ...getCurrentViewport(camera, defaultTarget, size) },
					}));
				},
				setDpr: (dpr: NgtDpr) =>
					set((state) => {
						const resolved = makeDpr(dpr, window);
						return {
							viewport: {
								...state.viewport,
								dpr: resolved,
								initialDpr: state.viewport.initialDpr || resolved,
							},
						};
					}),
				setFrameloop: (frameloop: 'always' | 'demand' | 'never' = 'always') => {
					const clock = get('clock');

					// if frameloop === "never" clock.elapsedTime is updated using advance(timestamp)
					clock.stop();
					clock.elapsedTime = 0;

					if (frameloop !== 'never') {
						clock.start();
						clock.elapsedTime = 0;
					}
					set(() => ({ frameloop }));
				},

				previousRoot: parent,
				internal: {
					active: false,
					priority: 0,
					frames: 0,
					lastEvent: new ElementRef(null),
					interaction: [],
					hovered: new Map(),
					subscribers: [],
					initialClick: [0, 0],
					initialHits: [],
					capturedMap: new Map(),

					subscribe: (
						callback: NgtBeforeRenderRecord['callback'],
						priority = 0,
						_store: NgtSignalStore<NgtState> = store,
					) => {
						const internal = get('internal');
						// If this subscription was given a priority, it takes rendering into its own hands
						// For that reason we switch off automatic rendering and increase the manual flag
						// As long as this flag is positive there can be no internal rendering at all
						// because there could be multiple render subscriptions
						internal.priority = internal.priority + (priority > 0 ? 1 : 0);
						internal.subscribers.push({ callback, priority, store });
						// Register subscriber and sort layers from lowest to highest, meaning,
						// highest priority renders last (on top of the other frames)
						internal.subscribers = internal.subscribers.sort(
							(a, b) => (a.priority || 0) - (b.priority || 0),
						);
						return () => {
							const internal = get('internal');
							if (internal?.subscribers) {
								// Decrease manual flag if this subscription had a priority
								internal.priority = internal.priority - (priority > 0 ? 1 : 0);
								// Remove subscriber from list
								internal.subscribers = internal.subscribers.filter((s) => s.callback !== callback);
							}
						};
					},
				},
			};
		});

		// NOTE: assign pointerMissed$ so we can use it in events
		Object.defineProperty(store, 'pointerMissed$', { get: () => pointerMissed$ });

		const state = store.get();

		let oldSize = state.size;
		let oldDpr = state.viewport.dpr;
		let oldCamera = state.camera;

		const _camera = store.select('camera');
		const _size = store.select('size');
		const _viewport = store.select('viewport');

		effect(() => {
			const [camera, size, viewport, gl] = [_camera(), _size(), _viewport(), store.get('gl')];

			// Resize camera and renderer on changes to size and pixelratio
			if (size !== oldSize || viewport.dpr !== oldDpr) {
				oldSize = size;
				oldDpr = viewport.dpr;
				// Update camera & renderer
				updateCamera(camera, size);
				gl.setPixelRatio(viewport.dpr);

				const updateStyle =
					typeof HTMLCanvasElement !== 'undefined' && gl.domElement instanceof HTMLCanvasElement;
				gl.setSize(size.width, size.height, updateStyle);
			}

			// Update viewport once the camera changes
			if (camera !== oldCamera) {
				oldCamera = camera;
				updateCamera(camera, size);
				// Update viewport
				store.set((state) => ({
					viewport: { ...state.viewport, ...state.viewport.getCurrentViewport(camera) },
				}));
			}
		});

		return store;
	});
}

export type NgtStore = ReturnType<typeof storeFactory>;

export const NGT_STORE = new InjectionToken<NgtStore>('NgtStore token');
export const [injectNgtStore, provideNgtStore] = createInjectionToken(storeFactory, {
	isRoot: false,
	deps: [NGT_LOOP, DOCUMENT, Injector, [new Optional(), new SkipSelf(), NGT_STORE]],
	token: NGT_STORE,
});
