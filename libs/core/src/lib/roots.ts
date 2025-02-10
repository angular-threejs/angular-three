import { Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { prepare } from './instance';
import { injectLoop, roots } from './loop';
import { injectStore } from './store';
import type { NgtCanvasElement, NgtCanvasOptions, NgtDisposable, NgtEquConfig, NgtSize, NgtState } from './types';
import { applyProps } from './utils/apply-props';
import { is } from './utils/is';
import { makeCameraInstance, makeDpr, makeRendererInstance } from './utils/make';
import { checkNeedsUpdate } from './utils/update';

const shallowLoose = { objects: 'shallow', strict: false } as NgtEquConfig;

export function injectCanvasRootInitializer(injector?: Injector) {
	return assertInjector(injectCanvasRootInitializer, injector, () => {
		const injectedStore = injectStore();
		const loop = injectLoop();

		return (canvas: NgtCanvasElement) => {
			const exist = roots.has(canvas);
			let store = roots.get(canvas);

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
			let lastCamera: NgtCanvasOptions['camera'];

			return {
				isConfigured,
				destroy: (timeout = 500) => {
					const root = roots.get(canvas);
					if (root) {
						root.update((state) => ({ internal: { ...state.internal, active: false } }));
						setTimeout(() => {
							try {
								const state = root.snapshot;
								state.events.disconnect?.();
								state.gl?.renderLists?.dispose?.();
								state.gl?.forceContextLoss?.();
								if (state.gl?.xr) state.xr.disconnect();
								dispose(state.scene);
								roots.delete(canvas);
							} catch (e) {
								console.error('[NGT] Unexpected error while destroying Canvas Root', e);
							}
						}, timeout);
					}
				},
				configure: (inputs: NgtCanvasOptions) => {
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

					// Create default camera, don't overwrite any user-set state
					if (
						!state.camera ||
						(state.camera === lastCamera && !is.equ(lastCamera, cameraOptions, shallowLoose))
					) {
						lastCamera = cameraOptions;
						const isCamera = is.three<THREE.Camera>(cameraOptions, 'isCamera');
						let camera = isCamera
							? cameraOptions
							: makeCameraInstance(orthographic, sizeOptions ?? state.size);

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
									camera?.updateProjectionMatrix();
								}
							}

							// always look at center or passed-in lookAt by default
							if (!state.camera && !cameraOptions?.rotation && !cameraOptions?.quaternion) {
								if (Array.isArray(lookAt)) camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
								else if (typeof lookAt === 'number') camera.lookAt(lookAt, lookAt, lookAt);
								else if (lookAt?.isVector3) camera.lookAt(lookAt);
								else camera.lookAt(0, 0, 0);
							}

							// update projection matrix after applyprops
							camera.updateProjectionMatrix?.();
						}

						if (!is.instance(camera)) camera = prepare(camera, '', { store });

						stateToUpdate.camera = camera;

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

export type NgtCanvasConfigurator = ReturnType<ReturnType<typeof injectCanvasRootInitializer>>;

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

// Disposes an object and all its properties
export function dispose<T extends NgtDisposable>(obj: T): void {
	if (obj.type !== 'Scene') obj.dispose?.();
	for (const p in obj) {
		const prop = obj[p] as NgtDisposable | undefined;
		if (prop?.type !== 'Scene') prop?.dispose?.();
	}
}
