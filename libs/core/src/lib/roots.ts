import { DestroyRef, Injector, effect, inject, type EffectRef } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import type { NgtCanvasInputs } from './canvas';
import { prepare } from './instance';
import { injectNgtLoop } from './loop';
import { injectNgtStore, type NgtSize, type NgtState } from './store';
import type { NgtAnyRecord, NgtEquConfig } from './types';
import { applyProps } from './utils/apply-props';
import { is } from './utils/is';
import { makeDefaultCamera, makeDefaultRenderer, makeDpr } from './utils/make';
import type { NgtSignalStore } from './utils/signal-store';
import { checkNeedsUpdate } from './utils/update';

const shallowLoose = { objects: 'shallow', strict: false } as NgtEquConfig;

export const roots = new Map<HTMLCanvasElement, NgtSignalStore<NgtState>>();

export function injectCanvasRootInitializer(injector?: Injector) {
	return assertInjector(injectCanvasRootInitializer, injector, () => {
		const assertedInjector = inject(Injector);
		const injectedStore = injectNgtStore();
		const loop = injectNgtLoop();
		const destroyRef = inject(DestroyRef);

		return (canvas: HTMLCanvasElement) => {
			const exist = roots.has(canvas);
			let store = roots.get(canvas) as NgtSignalStore<NgtState>;

			if (store) {
				console.warn('[NGT] Same canvas root is being created twice');
			}

			store ||= injectedStore;

			if (!store) {
				throw new Error('[NGT] No store initialized');
			}

			if (!exist) {
				roots.set(canvas, store);
			}

			let isConfigured = false;
			let invalidateRef: EffectRef;

			destroyRef.onDestroy(() => invalidateRef?.destroy());

			return {
				isConfigured,
				destroy: (timeout = 500) => {
					const root = roots.get(canvas);
					if (root) {
						root.set((state) => ({ internal: { ...state.internal, active: false } }));
						setTimeout(() => {
							try {
								const state = root.get();
								state.events.disconnect?.();
								state.gl?.renderLists?.dispose?.();
								state.gl?.forceContextLoss?.();
								if (state.gl?.xr) state.xr.disconnect();
								dispose(state);
								roots.delete(canvas);
							} catch (e) {
								console.error('[NGT] Unexpected error while destroying Canvas Root', e);
							}
						}, timeout);
					}
				},
				configure: (inputs: NgtCanvasInputs) => {
					const {
						gl: glOptions,
						size: sizeOptions,
						camera: cameraOptions,
						raycaster: raycasterOptions,
						scene: sceneOptions,
						events,
						orthographic,
						lookAt,
						shadows,
						linear,
						legacy,
						flat,
						dpr,
						frameloop,
						performance,
					} = inputs;

					const state = store.get();
					const stateToUpdate: Partial<NgtState> = {};

					// setup renderer
					let gl = state.gl;
					if (!state.gl) stateToUpdate.gl = gl = makeDefaultRenderer(glOptions, canvas);

					// setup raycaster
					let raycaster = state.raycaster;
					if (!raycaster) stateToUpdate.raycaster = raycaster = new THREE.Raycaster();

					// set raycaster options
					const { params, ...options } = raycasterOptions || {};
					if (!is.equ(options, raycaster, shallowLoose)) applyProps(raycaster, { ...options });
					if (!is.equ(params, raycaster.params, shallowLoose)) {
						applyProps(raycaster, { params: { ...raycaster.params, ...(params || {}) } });
					}

					// create default camera
					if (!state.camera) {
						const isCamera = is.camera(cameraOptions);
						let camera = isCamera ? cameraOptions : makeDefaultCamera(orthographic || false, state.size);

						if (!isCamera) {
							if (cameraOptions) applyProps(camera, cameraOptions);

							// set position.z
							if (!cameraOptions?.position) camera.position.z = 5;

							// always look at center or passed-in lookAt by default
							if (!cameraOptions?.rotation && !cameraOptions?.quaternion) {
								if (Array.isArray(lookAt)) camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
								else if (lookAt instanceof THREE.Vector3) camera.lookAt(lookAt);
								else camera.lookAt(0, 0, 0);
							}

							// update projection matrix after applyprops
							camera.updateProjectionMatrix?.();
						}

						if (!is.instance(camera)) camera = prepare(camera, { store });

						stateToUpdate.camera = camera;
					}

					// Set up scene (one time only!)
					if (!state.scene) {
						let scene: THREE.Scene;

						if (sceneOptions instanceof THREE.Scene) {
							scene = prepare(sceneOptions, { store });
						} else {
							scene = prepare(new THREE.Scene(), { store });
							if (sceneOptions) applyProps(scene, sceneOptions);
						}

						stateToUpdate.scene = scene;
					}

					// Set up XR (one time only!)
					if (!state.xr) {
						// Handle frame behavior in WebXR
						const handleXRFrame: XRFrameRequestCallback = (timestamp: number, frame?: XRFrame) => {
							const state = store.get();
							if (state.frameloop === 'never') return;
							loop.advance(timestamp, true, store, frame);
						};

						// Toggle render switching on session
						const handleSessionChange = () => {
							const state = store.get();
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

					// Safely set color management if available.
					// Avoid accessing THREE.ColorManagement to play nice with older versions
					if (THREE.ColorManagement) {
						const ColorManagement = THREE.ColorManagement as NgtAnyRecord;
						if ('enabled' in ColorManagement) ColorManagement['enabled'] = !legacy ?? false;
						else if ('legacyMode' in ColorManagement) ColorManagement['legacyMode'] = legacy ?? true;
					}

					// set color space and tonemapping preferences
					const LinearEncoding = 3000;
					const sRGBEncoding = 3001;
					applyProps(gl, {
						outputEncoding: linear ? LinearEncoding : sRGBEncoding,
						toneMapping: flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
					});

					// Update color management state
					if (state.legacy !== legacy) stateToUpdate.legacy = legacy;
					if (state.linear !== linear) stateToUpdate.linear = linear;
					if (state.flat !== flat) stateToUpdate.flat = flat;

					// Set gl props
					gl.setClearAlpha(0);
					gl.setPixelRatio(makeDpr(state.viewport.dpr));
					gl.setSize(state.size.width, state.size.height);

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

					store.set(stateToUpdate);

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
					queueMicrotask(() => {
						invalidateRef?.destroy();
						invalidateRef = effect(() => void store.state().invalidate(), {
							manualCleanup: true,
							injector: assertedInjector,
						});
					});
				},
			};
		};
	});
}

export type NgtCanvasConfigurator = ReturnType<ReturnType<typeof injectCanvasRootInitializer>>;

function computeInitialSize(canvas: HTMLCanvasElement | THREE.OffscreenCanvas, defaultSize?: NgtSize): NgtSize {
	if (defaultSize) return defaultSize;

	if (canvas instanceof HTMLCanvasElement && canvas.parentElement) {
		return canvas.parentElement.getBoundingClientRect();
	}

	return { width: 0, height: 0, top: 0, left: 0 };
}

// Disposes an object and all its properties
function dispose<TObj extends { dispose?: () => void; type?: string; [key: string]: any }>(obj: TObj) {
	if (obj.dispose && obj.type !== 'Scene') obj.dispose();
	for (const p in obj) {
		(p as any).dispose?.();
		delete obj[p];
	}
}
