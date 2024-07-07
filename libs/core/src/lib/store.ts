import { DOCUMENT } from '@angular/common';
import { ElementRef, InjectOptions, InjectionToken, WritableSignal, effect, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Camera, Clock, EventDispatcher, Object3D, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { NgtCamera, NgtDomEvent, NgtEventManager, NgtPointerCaptureTarget, NgtThreeEvent } from './events';
import { NgtInstanceNode } from './instance';
import { injectNgtLoop } from './loop';
import { is } from './utils/is';
import { makeDpr } from './utils/make';
import { NgtSignalStore, signalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

export type NgtRendererLike = { render: (scene: Scene, camera: Camera) => any };
export type NgtCameraManual = NgtCamera & { manual?: boolean };
export type NgtDpr = number | [min: number, max: number];
export type NgtSize = { width: number; height: number; top: number; left: number };

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
	interaction: Object3D[];
	hovered: Map<string, NgtThreeEvent<NgtDomEvent>>;
	capturedMap: Map<number, Map<Object3D, NgtPointerCaptureTarget>>;
	initialClick: [x: number, y: number];
	initialHits: Object3D[];
	subscribers: NgtBeforeRenderRecord[];
	subscribe: (
		callback: NgtBeforeRenderRecord['callback'],
		priority?: number,
		store?: NgtSignalStore<NgtState>,
	) => () => void;
};

export type NgtState = {
	/** The instance of the renderer */
	gl: WebGLRenderer;
	/** Default camera */
	camera: NgtCameraManual;
	/** Default scene */
	scene: Scene;
	/** Default raycaster */
	raycaster: Raycaster;
	/** Default clock */
	clock: Clock;
	/** Event layer interface, contains the event handler and the node they're connected to */
	events: NgtEventManager<any>;
	/** XR interface */
	xr: { connect: () => void; disconnect: () => void };
	/** Currently used controls */
	controls: EventDispatcher | null;
	/** Normalized event coordinates */
	pointer: Vector2;
	/* Whether to enable r139's ColorManagement */
	legacy: boolean;
	/** Shortcut to gl.outputColorSpace = LinearSRGBColorSpace */
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
			target?: Vector3 | Parameters<Vector3['set']>,
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
	/** If this state model is layered (via createPortal) then this contains the previous layer */
	previousRoot: NgtSignalStore<NgtState> | null;
	/** Internals */
	internal: NgtInternalState;
};

function storeFactory(previousStore: NgtSignalStore<NgtState> | null) {
	const document = inject(DOCUMENT);
	const window = document.defaultView;

	if (!window) {
		// TODO: revisit this when we need to support multiple platforms
		throw new Error(`[NGT] Window is not available.`);
	}

	const loop = injectNgtLoop();

	// NOTE: using Subject because we do not care about late-subscribers
	const pointerMissed$ = new Subject<MouseEvent>();

	const store: NgtSignalStore<NgtState> = signalStore<NgtState>(({ get, update }) => {
		const { invalidate, advance } = loop;

		const position = new Vector3();
		const defaultTarget = new Vector3();
		const tempTarget = new Vector3();

		function getCurrentViewport(
			camera: NgtCamera = get('camera'),
			target: Vector3 | Parameters<Vector3['set']> = defaultTarget,
			size: NgtSize = get('size'),
		): Omit<NgtViewport, 'dpr' | 'initialDpr'> {
			const { width, height, top, left } = size;
			const aspect = width / height;

			if (target instanceof Vector3) tempTarget.copy(target);
			else tempTarget.set(...target);

			const distance = camera.getWorldPosition(position).distanceTo(tempTarget);

			if (is.orthographicCamera(camera)) {
				return { width: width / camera.zoom, height: height / camera.zoom, top, left, factor: 1, distance, aspect };
			}

			const fov = (camera.fov * Math.PI) / 180; // convert vertical fov to radians
			const h = 2 * Math.tan(fov / 2) * distance; // visible height
			const w = h * (width / height);
			return { width: w, height: h, top, left, factor: width / w, distance, aspect };
		}

		let performanceTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
		const setPerformanceCurrent = (current: number) =>
			update((state) => ({ performance: { ...state.performance, current } }));

		const pointer = new Vector2();

		return {
			pointerMissed$: pointerMissed$.asObservable(),
			events: { priority: 1, enabled: true, connected: false },

			invalidate: (frames = 1) => invalidate(store, frames),
			advance: (timestamp: number, runGlobalEffects?: boolean) => advance(timestamp, runGlobalEffects, store),

			legacy: false,
			linear: false,
			flat: false,

			controls: null,
			clock: new Clock(),
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
					if (state.performance.current !== state.performance.min) setPerformanceCurrent(state.performance.min);
					// Go back to upper bound performance after a while unless something regresses meanwhile
					performanceTimeout = setTimeout(() => {
						setPerformanceCurrent(get('performance', 'max'));
						// safeDetectChanges(cdr);
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
				update((state) => ({ ...state, events: { ...state.events, ...events } })),
			setSize: (width: number, height: number, top?: number, left?: number) => {
				const camera = get('camera');
				const size = { width, height, top: top || 0, left: left || 0 };
				update((state) => ({
					size,
					viewport: { ...state.viewport, ...getCurrentViewport(camera, defaultTarget, size) },
				}));
			},
			setDpr: (dpr: NgtDpr) =>
				update((state) => {
					const resolved = makeDpr(dpr, window);
					return { viewport: { ...state.viewport, dpr: resolved, initialDpr: state.viewport.initialDpr || resolved } };
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

				update(() => ({ frameloop }));
			},

			previousRoot: previousStore,
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
					internal.subscribers.push({ callback, priority, store: _store });
					// Register subscriber and sort layers from lowest to highest, meaning,
					// highest priority renders last (on top of the other frames)
					internal.subscribers = internal.subscribers.sort((a, b) => (a.priority || 0) - (b.priority || 0));

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

	Object.defineProperty(store, 'pointerMissed$', { get: () => pointerMissed$ });

	let {
		size: oldSize,
		viewport: { dpr: oldDpr },
		camera: oldCamera,
	} = store.snapshot;

	effect(() => {
		const {
			camera: newCamera,
			size: newSize,
			viewport: { dpr: newDpr },
			gl,
		} = store.state();

		// Resize camera and renderer on changes to size and pixel-ratio
		if (newSize !== oldSize || newDpr !== oldDpr) {
			oldSize = newSize;
			oldDpr = newDpr;
			// Update camera & renderer
			updateCamera(newCamera, newSize);
			gl.setPixelRatio(newDpr);

			const updateStyle = typeof HTMLCanvasElement !== 'undefined' && gl.domElement instanceof HTMLCanvasElement;
			gl.setSize(newSize.width, newSize.height, updateStyle);
		}

		// Update viewport once the camera changes
		if (newCamera !== oldCamera) {
			oldCamera = newCamera;
			updateCamera(newCamera, newSize);
			// Update viewport
			store.update((state) => ({ viewport: { ...state.viewport, ...state.viewport.getCurrentViewport(newCamera) } }));
		}
	});

	return store;
}

export const NGT_STORE = new InjectionToken<NgtSignalStore<NgtState>>('NgtStore Token');
export const NGT_STORE_SIGNAL = new InjectionToken<WritableSignal<{ scene: Scene }>>('NgtStore Signal Token');

export function provideNgtStore(store?: () => NgtSignalStore<NgtState>) {
	if (store) {
		return { provide: NGT_STORE, useFactory: store };
	}
	return { provide: NGT_STORE, useFactory: storeFactory };
}

export function injectNgtStore(options: InjectOptions & { optional?: false }): NgtSignalStore<NgtState>;
export function injectNgtStore(options: InjectOptions): NgtSignalStore<NgtState> | null;
export function injectNgtStore(): NgtSignalStore<NgtState>;
export function injectNgtStore(options?: InjectOptions) {
	return inject(NGT_STORE, options as InjectOptions);
}
