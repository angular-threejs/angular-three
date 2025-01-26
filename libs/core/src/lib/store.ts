import { DOCUMENT } from '@angular/common';
import { ElementRef, InjectOptions, InjectionToken, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import { injectLoop } from './loop';
import type {
	NgtBeforeRenderRecord,
	NgtCamera,
	NgtDpr,
	NgtEventManager,
	NgtFrameloop,
	NgtSize,
	NgtState,
	NgtXRManager,
} from './types';
import { is } from './utils/is';
import { makeDpr } from './utils/make';
import { SignalState, signalState } from './utils/signal-state';
import { updateCamera } from './utils/update';

function storeFactory() {
	const { invalidate, advance } = injectLoop();
	const document = inject(DOCUMENT);
	const window = document.defaultView || undefined;

	// NOTE: using Subject because we do not care about late-subscribers
	const pointerMissed$ = new Subject<MouseEvent>();

	const position = new THREE.Vector3();
	const defaultTarget = new THREE.Vector3();
	const tempTarget = new THREE.Vector3();

	let performanceTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	const pointer = new THREE.Vector2();

	const store: SignalState<NgtState> = signalState<NgtState>({
		pointerMissed$: pointerMissed$.asObservable(),
		events: { priority: 1, enabled: true, connected: false },

		// Mock objects that have to be configured
		gl: null as unknown as THREE.WebGLRenderer,
		camera: null as unknown as NgtCamera,
		raycaster: null as unknown as THREE.Raycaster,
		scene: null as unknown as THREE.Scene,
		xr: null as unknown as NgtXRManager,

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
				const state = store.snapshot;
				// Clear timeout
				if (performanceTimeout) clearTimeout(performanceTimeout);
				// Set lower bound performance
				if (state.performance.current !== state.performance.min)
					store.update((state) => ({ performance: { ...state.performance, current: state.performance.min } }));
				// Go back to upper bound performance after a while unless something regresses meanwhile
				performanceTimeout = setTimeout(
					() =>
						store.update((state) => ({
							performance: { ...state.performance, current: store.snapshot.performance.max },
						})),
					state.performance.debounce,
				);
			},
		},

		size: { width: 0, height: 0, top: 0, left: 0 },
		viewport: {
			initialDpr: window?.devicePixelRatio || 1,
			dpr: window?.devicePixelRatio || 1,
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			aspect: 0,
			distance: 0,
			factor: 0,
			getCurrentViewport(
				camera: NgtCamera = store.snapshot.camera,
				target: THREE.Vector3 | Parameters<THREE.Vector3['set']> = defaultTarget,
				size: NgtSize = store.snapshot.size,
			) {
				const { width, height, top, left } = size;
				const aspect = width / height;

				if ((target as THREE.Vector3).isVector3) tempTarget.copy(target as THREE.Vector3);
				else tempTarget.set(...(target as Parameters<THREE.Vector3['set']>));

				const distance = camera.getWorldPosition(position).distanceTo(tempTarget);

				if (is.orthographicCamera(camera)) {
					return { width: width / camera.zoom, height: height / camera.zoom, top, left, factor: 1, distance, aspect };
				}

				const fov = (camera.fov * Math.PI) / 180; // convert vertical fov to radians
				const h = 2 * Math.tan(fov / 2) * distance; // visible height
				const w = h * (width / height);
				return { width: w, height: h, top, left, factor: width / w, distance, aspect };
			},
		},

		setEvents: (events: Partial<NgtEventManager<any>>) =>
			store.update((state) => ({ events: { ...state.events, ...events } })),
		setSize: (width: number, height: number, top?: number, left?: number) => {
			const camera = store.snapshot.camera;
			const size = { width, height, top: top ?? 0, left: left ?? 0 };

			store.update((state) => ({
				size,
				viewport: {
					...state.viewport,
					...state.viewport.getCurrentViewport(camera, defaultTarget, size),
				},
			}));
		},
		setDpr: (dpr: NgtDpr) => {
			const resolved = makeDpr(dpr, window);
			store.update((state) => ({
				viewport: { ...state.viewport, dpr: resolved, initialDpr: state.viewport.initialDpr || resolved },
			}));
		},
		setFrameloop: (frameloop?: NgtFrameloop) => {
			const clock = store.snapshot.clock;

			// if frameloop === "never" clock.elapsedTime is updated using advance(timestamp)
			clock.stop();
			clock.elapsedTime = 0;

			if (frameloop !== 'never') {
				clock.start();
				clock.elapsedTime = 0;
			}

			store.update(() => ({ frameloop }));
		},
		previousRoot: null,
		internal: {
			active: false,
			priority: 0,
			frames: 0,
			lastEvent: new ElementRef(null),
			interaction: [],
			hovered: new Map(),
			capturedMap: new Map(),
			initialClick: [0, 0],
			initialHits: [],
			subscribers: [],
			subscribe: (callback: NgtBeforeRenderRecord['callback'], priority = 0, _store: SignalState<NgtState> = store) => {
				const internal = _store.snapshot.internal;
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
					const internal = _store.snapshot.internal;
					if (internal?.subscribers) {
						// Decrease manual flag if this subscription had a priority
						internal.priority = internal.priority - (priority > 0 ? 1 : 0);
						// Remove subscriber from list
						internal.subscribers = internal.subscribers.filter((s) => s.callback !== callback);
					}
				};
			},
		},
	});

	Object.defineProperty(store, '__pointerMissed$', { get: () => pointerMissed$ });

	let {
		size: oldSize,
		viewport: { dpr: oldDpr },
		camera: oldCamera,
	} = store.snapshot;

	effect(() => {
		const newCamera = store.camera();
		const newSize = store.size();
		const newDpr = store.viewport.dpr();
		const gl = store.gl();

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

export const NGT_STORE = new InjectionToken<SignalState<NgtState>>('NgtStore Token');

export function provideStore(store?: () => SignalState<NgtState>) {
	if (store) {
		return { provide: NGT_STORE, useFactory: store };
	}
	return { provide: NGT_STORE, useFactory: storeFactory };
}

export function injectStore(options: InjectOptions & { optional?: false }): SignalState<NgtState>;
export function injectStore(options: InjectOptions): SignalState<NgtState> | null;
export function injectStore(): SignalState<NgtState>;
export function injectStore(options?: InjectOptions) {
	return inject(NGT_STORE, options as InjectOptions);
}
