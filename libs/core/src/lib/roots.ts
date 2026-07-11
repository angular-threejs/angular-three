import { effect, inject, Injector, type EffectRef } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { prepare } from './instance';
import { injectLoop, roots } from './loop';
import { injectStore } from './store';
import type { NgtCanvasElement, NgtCanvasOptions, NgtDisposable, NgtEquConfig, NgtSize, NgtState } from './types';
import { applyProps } from './utils/apply-props';
import { is } from './utils/is';
import { makeCameraInstance, makeDpr, makeRendererInstance } from './utils/make';
import type { SignalState } from './utils/signal-state';
import { checkNeedsUpdate } from './utils/update';

const shallowLoose = { objects: 'shallow', strict: false } as NgtEquConfig;

type CameraConfiguration = {
	camera: NgtCanvasOptions['camera'];
	lookAt: NgtCanvasOptions['lookAt'];
	orthographic: boolean;
};

type RootLifecycle = {
	store: SignalState<NgtState>;
	owner: object;
	teardown?: ReturnType<typeof setTimeout>;
	managedCamera?: NgtState['camera'];
	cameraConfiguration?: CameraConfiguration;
	appliedCameraConfiguration?: CameraConfiguration;
	cameraWatcher?: EffectRef;
};

const rootLifecycles = new WeakMap<NgtCanvasElement, RootLifecycle>();

function cloneConfigurationValue<T>(value: T): T {
	if (Array.isArray(value)) return value.slice() as T;
	if (value && typeof value === 'object' && 'clone' in value && typeof value.clone === 'function') {
		return value.clone() as T;
	}
	return value;
}

function snapshotCameraOptions(camera: NgtCanvasOptions['camera']): NgtCanvasOptions['camera'] {
	if (!camera || is.three<THREE.Camera>(camera, 'isCamera')) return camera;
	const options = camera as Record<string, unknown>;
	return Object.fromEntries(
		Object.entries(options).map(([key, value]) => [key, cloneConfigurationValue(value)]),
	) as NgtCanvasOptions['camera'];
}

function configurationValuesEqual(previous: unknown, next: unknown): boolean {
	if (Object.is(previous, next)) return true;
	if (Array.isArray(previous) && Array.isArray(next)) {
		return previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
	}
	if (
		previous &&
		next &&
		typeof previous === 'object' &&
		typeof next === 'object' &&
		'equals' in previous &&
		typeof previous.equals === 'function'
	) {
		return previous.equals(next);
	}
	return false;
}

function cameraOptionsEqual(previous: NgtCanvasOptions['camera'], next: NgtCanvasOptions['camera']): boolean {
	if (Object.is(previous, next)) return true;
	if (!previous || !next) return false;
	if (is.three<THREE.Camera>(previous, 'isCamera') || is.three<THREE.Camera>(next, 'isCamera')) return false;
	const previousKeys = Object.keys(previous);
	const nextKeys = Object.keys(next);
	const previousRecord = previous as Record<string, unknown>;
	const nextRecord = next as Record<string, unknown>;
	return (
		previousKeys.length === nextKeys.length &&
		previousKeys.every(
			(key) =>
				Object.prototype.hasOwnProperty.call(nextRecord, key) &&
				configurationValuesEqual(previousRecord[key], nextRecord[key]),
		)
	);
}

function cameraConfigurationsEqual(previous: CameraConfiguration | undefined, next: CameraConfiguration): boolean {
	return (
		!!previous &&
		previous.orthographic === next.orthographic &&
		cameraOptionsEqual(previous.camera, next.camera) &&
		configurationValuesEqual(previous.lookAt, next.lookAt)
	);
}

function createManagedCamera(
	configuration: CameraConfiguration,
	store: SignalState<NgtState>,
	size: NgtSize = store.snapshot.size,
) {
	const { camera: cameraOptions, lookAt, orthographic } = configuration;
	const isCamera = is.three<THREE.Camera>(cameraOptions, 'isCamera');
	let camera = isCamera ? cameraOptions : makeCameraInstance(orthographic, size);

	if (!isCamera) {
		camera.position.z = 5;
		if (cameraOptions) {
			applyProps(camera, cameraOptions);
			if (
				'aspect' in cameraOptions ||
				'left' in cameraOptions ||
				'right' in cameraOptions ||
				'top' in cameraOptions ||
				'bottom' in cameraOptions
			) {
				Object.assign(camera, { manual: true });
				camera.updateProjectionMatrix();
			}
		}

		if (!cameraOptions?.rotation && !cameraOptions?.quaternion) {
			if (Array.isArray(lookAt)) camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
			else if (typeof lookAt === 'number') camera.lookAt(lookAt, lookAt, lookAt);
			else if (lookAt?.isVector3) camera.lookAt(lookAt);
			else camera.lookAt(0, 0, 0);
		}

		camera.updateProjectionMatrix?.();
	}

	if (!is.instance(camera)) camera = prepare(camera, '', { store });
	return camera;
}

function cancelPerformanceRegression(store: SignalState<NgtState>): void {
	const regress = store.snapshot.performance.regress as typeof store.snapshot.performance.regress & {
		cancel?: () => void;
	};
	regress.cancel?.();
}

/**
 * Creates a canvas root initializer function.
 *
 * This function sets up the Three.js rendering context including the WebGL renderer,
 * camera, scene, and all related state. It returns a configurator object that can
 * be used to update canvas options and destroy the root.
 *
 * @param injector - Optional injector for dependency injection
 * @returns A function that takes a canvas element and returns a configurator
 *
 * @example
 * ```typescript
 * const initRoot = canvasRootInitializer();
 * const configurator = initRoot(canvasElement);
 * configurator.configure({ shadows: true, dpr: [1, 2] });
 * ```
 */
export function canvasRootInitializer(injector?: Injector) {
	return assertInjector(canvasRootInitializer, injector, () => {
		const injectedStore = injectStore();
		const loop = injectLoop();
		const rootInjector = inject(Injector);

		return (canvas: NgtCanvasElement) => {
			const exist = roots.has(canvas);
			let store = roots.get(canvas);
			const previousLifecycle = rootLifecycles.get(canvas);

			if (store && !previousLifecycle?.teardown) {
				console.warn('[NGT] Same canvas root is being created twice');
			}

			store ||= injectedStore;

			if (!store) {
				throw new Error('[NGT] No store initialized');
			}

			if (!exist) {
				roots.set(canvas, store);
			}

			if (previousLifecycle?.teardown) {
				clearTimeout(previousLifecycle.teardown);
				previousLifecycle.teardown = undefined;
				const performance = store.snapshot.performance;
				if (performance.current !== performance.max) {
					store.update((state) => ({
						performance: { ...state.performance, current: state.performance.max },
					}));
				}
			}

			const owner = {};
			const lifecycle: RootLifecycle = previousLifecycle?.store === store ? previousLifecycle : { store, owner };
			lifecycle.owner = owner;
			rootLifecycles.set(canvas, lifecycle);
			lifecycle.cameraWatcher ??= effect(
				() => {
					const activeCamera = store.camera();
					const desired = lifecycle.cameraConfiguration;
					if (
						!desired ||
						!lifecycle.managedCamera ||
						activeCamera !== lifecycle.managedCamera ||
						cameraConfigurationsEqual(lifecycle.appliedCameraConfiguration, desired)
					)
						return;

					const camera = createManagedCamera(desired, store);
					lifecycle.managedCamera = camera;
					lifecycle.appliedCameraConfiguration = desired;
					const raycaster = store.snapshot.raycaster;
					if (raycaster) raycaster.camera = camera;
					store.update({ camera });
				},
				{ injector: rootInjector },
			);

			let isConfigured = false;
			let destroyRequested = false;

			return {
				get isConfigured() {
					return isConfigured;
				},
				destroy: (timeout = 500) => {
					if (destroyRequested) return;
					destroyRequested = true;
					const root = roots.get(canvas);
					if (
						root &&
						root === store &&
						rootLifecycles.get(canvas) === lifecycle &&
						lifecycle.owner === owner
					) {
						root.update((state) => ({ internal: { ...state.internal, active: false } }));
						cancelPerformanceRegression(root);
						const teardown = setTimeout(() => {
							if (
								roots.get(canvas) !== root ||
								rootLifecycles.get(canvas) !== lifecycle ||
								lifecycle.owner !== owner ||
								lifecycle.teardown !== teardown
							)
								return;

							lifecycle.teardown = undefined;
							try {
								const state = root.snapshot;
								const failures: unknown[] = [];
								const attempt = (cleanup: () => void) => {
									try {
										cleanup();
									} catch (error) {
										failures.push(error);
									}
								};
								attempt(() => state.events.disconnect?.());
								attempt(() => state.gl?.renderLists?.dispose?.());
								attempt(() => state.gl?.dispose?.());
								attempt(() => state.gl?.forceContextLoss?.());
								attempt(() => state.xr?.disconnect?.());
								attempt(() => dispose(state.scene));
								attempt(() => lifecycle.cameraWatcher?.destroy());
								if (failures.length) {
									console.error('[NGT] Errors while destroying Canvas Root', failures);
								}
							} finally {
								if (roots.get(canvas) === root) roots.delete(canvas);
								if (rootLifecycles.get(canvas) === lifecycle) rootLifecycles.delete(canvas);
							}
						}, timeout);
						lifecycle.teardown = teardown;
					}
				},
				configure: (inputs: NgtCanvasOptions) => {
					if (destroyRequested || rootLifecycles.get(canvas) !== lifecycle || lifecycle.owner !== owner)
						return;

					const {
						shadows = false,
						linear = false,
						flat = false,
						legacy = false,
						orthographic = false,
						frameloop = 'always',
						dpr = [1, 2],
						gl: glOptions,
						size: sizeOptions,
						camera: cameraOptions,
						raycaster: raycasterOptions,
						scene: sceneOptions,
						events,
						lookAt,
						performance,
					} = inputs;

					const state = store.snapshot;
					const stateToUpdate: Partial<NgtState> = {};

					// setup renderer
					let gl = state.gl;
					if (!state.gl) stateToUpdate.gl = gl = makeRendererInstance(glOptions, canvas);

					// setup raycaster
					let raycaster = state.raycaster;
					if (!raycaster) stateToUpdate.raycaster = raycaster = new THREE.Raycaster();

					// set raycaster options
					const { params, ...options } = raycasterOptions || {};
					if (!is.equ(options, raycaster, shallowLoose)) applyProps(raycaster, options);
					if (!is.equ(params, raycaster.params, shallowLoose)) {
						applyProps(raycaster, { params: { ...raycaster.params, ...(params || {}) } });
					}

					const cameraConfiguration: CameraConfiguration = {
						camera: snapshotCameraOptions(cameraOptions),
						lookAt: cloneConfigurationValue(lookAt),
						orthographic,
					};
					lifecycle.cameraConfiguration = cameraConfiguration;

					// Create the root-managed camera, but don't overwrite a camera installed directly in the store.
					if (
						!state.camera ||
						(state.camera === lifecycle.managedCamera &&
							!cameraConfigurationsEqual(lifecycle.appliedCameraConfiguration, cameraConfiguration))
					) {
						const camera = createManagedCamera(cameraConfiguration, store, sizeOptions ?? state.size);

						stateToUpdate.camera = camera;
						lifecycle.managedCamera = camera;
						lifecycle.appliedCameraConfiguration = cameraConfiguration;

						// Configure raycaster
						// https://github.com/pmndrs/react-xr/issues/300
						raycaster.camera = camera;
					}

					// Set up scene (one time only!)
					if (!state.scene) {
						let scene: THREE.Scene;

						if (is.three<THREE.Scene>(sceneOptions, 'isScene')) {
							scene = sceneOptions;
						} else {
							scene = new THREE.Scene();
							if (sceneOptions) applyProps(scene, sceneOptions);
						}

						applyProps(scene, {
							name: '__ngt_root_scene__',
							setAttribute: (name: string, value: string) => {
								if (canvas instanceof HTMLCanvasElement) {
									if (canvas.parentElement) {
										canvas.parentElement.setAttribute(name, value);
									} else {
										canvas.setAttribute(name, value);
									}
								}
							},
						});

						stateToUpdate.scene = prepare(scene, 'ngt-scene', { store });
					}

					// Set up XR (one time only!)
					if (!state.xr) {
						// Handle frame behavior in WebXR
						const handleXRFrame: XRFrameRequestCallback = (timestamp: number, frame?: XRFrame) => {
							const state = store.snapshot;
							if (state.frameloop === 'never') return;
							loop.advance(timestamp, true, store, frame);
						};

						// Toggle render switching on session
						const handleSessionChange = () => {
							const state = store.snapshot;
							state.gl.xr.enabled = state.gl.xr.isPresenting;
							state.gl.xr.setAnimationLoop(state.gl.xr.isPresenting ? handleXRFrame : null);
							if (!state.gl.xr.isPresenting) loop.invalidate(store);
						};

						// WebXR session manager
						const xr = {
							connect: () => {
								gl.xr.addEventListener('sessionstart', handleSessionChange);
								gl.xr.addEventListener('sessionend', handleSessionChange);
							},
							disconnect: () => {
								gl.xr.removeEventListener('sessionstart', handleSessionChange);
								gl.xr.removeEventListener('sessionend', handleSessionChange);
							},
						};

						// Subscribe to WebXR session events
						if (gl.xr && typeof gl.xr.addEventListener === 'function') xr.connect();
						stateToUpdate.xr = xr;
					}

					// Set shadowmap
					if (gl.shadowMap) {
						const oldEnabled = gl.shadowMap.enabled;
						const oldType = gl.shadowMap.type;
						gl.shadowMap.enabled = !!shadows;

						if (typeof shadows === 'boolean') {
							gl.shadowMap.type = THREE.PCFSoftShadowMap;
						} else if (typeof shadows === 'string') {
							const types = {
								basic: THREE.BasicShadowMap,
								percentage: THREE.PCFShadowMap,
								soft: THREE.PCFSoftShadowMap,
								variance: THREE.VSMShadowMap,
							};
							gl.shadowMap.type = types[shadows] ?? THREE.PCFSoftShadowMap;
						} else if (is.obj(shadows)) {
							Object.assign(gl.shadowMap, shadows);
						}

						if (oldEnabled !== gl.shadowMap.enabled || oldType !== gl.shadowMap.type)
							checkNeedsUpdate(gl.shadowMap);
					}

					THREE.ColorManagement.enabled = !legacy;

					if (!isConfigured) {
						// set color space and tonemapping preferences once
						applyProps(gl, {
							outputColorSpace: linear ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace,
							toneMapping: flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
						});
					}

					// Update color management state
					if (state.legacy !== legacy) stateToUpdate.legacy = legacy;
					if (state.linear !== linear) stateToUpdate.linear = linear;
					if (state.flat !== flat) stateToUpdate.flat = flat;

					// Set gl props
					if (gl.setClearAlpha) {
						gl.setClearAlpha(0);
					}
					gl.setPixelRatio(makeDpr(state.viewport.dpr));
					gl.setSize(sizeOptions?.width ?? state.size.width, sizeOptions?.height ?? state.size.height);

					if (
						is.obj(glOptions) &&
						!(typeof glOptions === 'function') &&
						!is.renderer(glOptions) &&
						!is.equ(glOptions, gl, shallowLoose)
					) {
						applyProps(gl, glOptions);
					}

					// Store events internally
					if (events && !state.events.handlers) stateToUpdate.events = events(store);

					// Check performance
					if (performance && !is.equ(performance, state.performance, shallowLoose)) {
						stateToUpdate.performance = { ...state.performance, ...performance };
					}

					if (Object.keys(stateToUpdate).length) {
						store.update(stateToUpdate);
					}

					// Check size, allow it to take on container bounds initially
					const size = computeInitialSize(canvas, sizeOptions);
					if (!is.equ(size, state.size, shallowLoose)) {
						state.setSize(size.width, size.height, size.top, size.left);
					}

					// Check pixelratio
					if (dpr && state.viewport.dpr !== makeDpr(dpr)) state.setDpr(dpr);
					// Check frameloop
					if (state.frameloop !== frameloop) state.setFrameloop(frameloop);

					isConfigured = true;
				},
			};
		};
	});
}

/**
 * Type representing the canvas configurator returned by canvasRootInitializer.
 */
export type NgtCanvasConfigurator = ReturnType<ReturnType<typeof canvasRootInitializer>>;

/**
 * Computes the initial size for a canvas element.
 * @internal
 */
function computeInitialSize(canvas: NgtCanvasElement, defaultSize?: NgtSize): NgtSize {
	if (defaultSize) return defaultSize;

	if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement && canvas.parentElement) {
		return canvas.parentElement.getBoundingClientRect();
	}

	if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
		return { width: canvas.width, height: canvas.height, top: 0, left: 0 };
	}

	return { width: 0, height: 0, top: 0, left: 0 };
}

/**
 * Disposes an object and all its disposable properties.
 *
 * Recursively calls dispose() on the object and all its properties that have
 * a dispose method, except for Scene objects which are handled separately.
 *
 * @typeParam T - The type of the object to dispose
 * @param obj - The object to dispose
 */
export function dispose<T extends NgtDisposable>(obj: T): void {
	if (obj.type !== 'Scene') obj.dispose?.();
	for (const p in obj) {
		const prop = obj[p] as NgtDisposable | undefined;
		if (prop?.type !== 'Scene') prop?.dispose?.();
	}
}
