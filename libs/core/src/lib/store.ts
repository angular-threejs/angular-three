import { ElementRef, InjectOptions, InjectionToken, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Clock, Vector2, Vector3 } from 'three';
import { injectLoop } from './loop';
import { NgtBeforeRenderRecord, NgtCamera, NgtDpr, NgtEventManager, NgtSize, NgtState, NgtViewport } from './types';
import { is } from './utils/is';
import { makeDpr } from './utils/make';
import { NgtSignalStore, signalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

function storeFactory(previousStore: NgtSignalStore<NgtState> | null) {
	const loop = injectLoop();

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

export function provideStore(store?: () => NgtSignalStore<NgtState>) {
	if (store) {
		return { provide: NGT_STORE, useFactory: store };
	}
	return { provide: NGT_STORE, useFactory: storeFactory };
}

export function injectStore(options: InjectOptions & { optional?: false }): NgtSignalStore<NgtState>;
export function injectStore(options: InjectOptions): NgtSignalStore<NgtState> | null;
export function injectStore(): NgtSignalStore<NgtState>;
export function injectStore(options?: InjectOptions) {
	return inject(NGT_STORE, options as InjectOptions);
}
