import {
	ACESFilmicToneMapping,
	BasicShadowMap,
	ColorManagement,
	NoToneMapping,
	PCFShadowMap,
	PCFSoftShadowMap,
	Raycaster,
	Scene,
	VSMShadowMap,
	Vector3,
} from 'three';
import { NgtCanvasOptions } from './canvas';
import { prepare } from './instance';
import { injectLoop } from './loop';
import { NgtSize, NgtState, injectStore } from './store';
import { NgtAnyRecord, NgtEquConfig } from './types';
import { applyProps } from './utils/apply-props';
import { is } from './utils/is';
import { makeCameraInstance, makeDpr, makeRendererInstance } from './utils/make';
import { NgtSignalStore } from './utils/signal-store';
import { checkNeedsUpdate } from './utils/update';

export type NgtCanvasElement = HTMLCanvasElement | OffscreenCanvas;

const shallowLoose = { objects: 'shallow', strict: false } as NgtEquConfig;

export const roots = new Map<NgtCanvasElement, NgtSignalStore<NgtState>>();

export function injectRootInitializer() {
	const store = injectStore();
	const loop = injectLoop();

	return (canvasElement: NgtCanvasElement) => {
		const exist = roots.get(canvasElement);
		let rootStore = roots.get(canvasElement);

		if (rootStore) {
			console.warn('[NGT] Same canvas root is being created twice');
		}

		rootStore ||= store;

		if (!rootStore) {
			throw new Error('[NGT] No store initialized');
		}

		if (!exist) {
			roots.set(canvasElement, rootStore);
		}

		let isConfigured = false;
		let lastCamera: NgtCanvasOptions['camera'];

		return {
			isConfigured,
			destroy: (timeout = 500) => {
				const root = roots.get(canvasElement);
				if (root) {
					root.update((state) => ({ internal: { ...state.internal, active: false } }));
					setTimeout(() => {
						try {
							const state = root.get();
							state.events.disconnect?.();
							state.gl?.renderLists?.dispose?.();
							state.gl?.forceContextLoss?.();
							if (state.gl?.xr) state.xr.disconnect();
							dispose(state);
							roots.delete(canvasElement);
						} catch (e) {
							console.error('[NGT] Unexpected error while destroying Canvas Root', e);
						}
					}, timeout);
				}
			},
			configure: (canvasOptions: NgtCanvasOptions) => {
				const {
					gl: glConfig,
					size: sizeConfig,
					scene: sceneOptions,
					events,
					shadows,
					linear,
					flat,
					legacy,
					orthographic,
					frameloop,
					dpr,
					performance,
					raycaster: raycastOptions,
					camera: cameraOptions,
					lookAt,
				} = canvasOptions;

				const state = store.snapshot;
				const stateToUpdate: Partial<NgtState> = {};

				// Set up renderer (one time only!)
				let gl = state.gl;
				if (!state.gl) stateToUpdate.gl = gl = makeRendererInstance(glConfig, canvasElement);

				// Set up raycaster (one time only!)
				let raycaster = state.raycaster;
				if (!raycaster) stateToUpdate.raycaster = raycaster = new Raycaster();

				// Set raycaster options
				const { params, ...options } = raycastOptions || {};
				if (!is.equ(canvasOptions, raycaster, shallowLoose)) applyProps(raycaster, options);
				if (!is.equ(params, raycaster.params, shallowLoose))
					applyProps(raycaster, { params: { ...raycaster.params, ...params } });

				// Create default camera, don't overwrite any user-set state
				if (!state.camera || (state.camera === lastCamera && !is.equ(lastCamera, cameraOptions, shallowLoose))) {
					lastCamera = cameraOptions;
					const isCamera = is.camera(cameraOptions);
					let camera = isCamera ? cameraOptions : makeCameraInstance(orthographic, state.size);

					if (!isCamera) {
						camera.position.z = 5;
						if (cameraOptions) {
							applyProps(camera, cameraOptions);
							// Preserve user-defined frustum if possible
							// https://github.com/pmndrs/react-three-fiber/issues/3160
							if (
								'aspect' in cameraOptions ||
								'left' in cameraOptions ||
								'right' in cameraOptions ||
								'bottom' in cameraOptions ||
								'top' in cameraOptions
							) {
								Object.assign(camera, { manual: true });
								camera.updateProjectionMatrix();
							}
						}
						// always look at center or passed-in lookAt by default
						if (!state.camera && !cameraOptions?.rotation && !cameraOptions?.quaternion) {
							if (Array.isArray(lookAt)) camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
							else if (lookAt instanceof Vector3) camera.lookAt(lookAt);
							else camera.lookAt(0, 0, 0);

							camera.updateProjectionMatrix();
						}
					}

					if (!is.instance(camera)) camera = prepare(camera, { store });
					stateToUpdate.camera = camera;

					// Configure raycaster
					// https://github.com/pmndrs/react-xr/issues/300
					raycaster.camera = camera;
				}

				// Set up scene (one time only!)
				if (!state.scene) {
					let scene: Scene;

					if (sceneOptions instanceof Scene) {
						scene = sceneOptions;
					} else {
						scene = new Scene();
						if (sceneOptions) applyProps(scene, sceneOptions);
					}

					stateToUpdate.scene = prepare(scene, { store });
				}

				// Set up XR (one time only!)
				if (!state.xr) {
					// Handle frame behavior in WebXR
					const handleXRFrame = (timestamp: number, frame?: XRFrame) => {
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
						connect() {
							gl.xr.addEventListener('sessionstart', handleSessionChange);
							gl.xr.addEventListener('sessionend', handleSessionChange);
						},
						disconnect() {
							gl.xr.removeEventListener('sessionstart', handleSessionChange);
							gl.xr.removeEventListener('sessionend', handleSessionChange);
						},
					};

					// Subscribe to WebXR session events
					if (typeof gl.xr?.addEventListener === 'function') xr.connect();
					stateToUpdate.xr = xr;
				}

				// Set shadowmap
				if (gl.shadowMap) {
					const oldEnabled = gl.shadowMap.enabled;
					const oldType = gl.shadowMap.type;
					gl.shadowMap.enabled = !!shadows;

					if (typeof shadows === 'boolean') {
						gl.shadowMap.type = PCFSoftShadowMap;
					} else if (typeof shadows === 'string') {
						const types = {
							basic: BasicShadowMap,
							percentage: PCFShadowMap,
							soft: PCFSoftShadowMap,
							variance: VSMShadowMap,
						};
						gl.shadowMap.type = types[shadows] ?? PCFSoftShadowMap;
					} else if (is.obj(shadows)) {
						Object.assign(gl.shadowMap, shadows);
					}

					if (oldEnabled !== gl.shadowMap.enabled || oldType !== gl.shadowMap.type) checkNeedsUpdate(gl.shadowMap);
				}

				// Safely set color management if available.
				// Avoid accessing THREE.ColorManagement to play nice with older versions
				if (ColorManagement) {
					const colorManagement = ColorManagement as NgtAnyRecord;
					if ('enabled' in colorManagement) colorManagement['enabled'] = !legacy ?? false;
					else if ('legacyMode' in colorManagement) colorManagement['legacyMode'] = legacy ?? true;
				}

				if (!isConfigured) {
					// Set color space and tonemapping preferences, once
					const LinearEncoding = 3000;
					const sRGBEncoding = 3001;
					applyProps(gl, {
						outputEncoding: linear ? LinearEncoding : sRGBEncoding,
						toneMapping: flat ? NoToneMapping : ACESFilmicToneMapping,
					});
				}

				// Update color management state
				if (state.legacy !== legacy) stateToUpdate.legacy = legacy;
				if (state.linear !== linear) stateToUpdate.linear = linear;
				if (state.flat !== flat) stateToUpdate.flat = flat;

				// Set gl props
				gl.setClearAlpha(0);
				gl.setPixelRatio(makeDpr(state.viewport.dpr));
				gl.setSize(state.size.width, state.size.height);

				if (
					glConfig &&
					!(typeof glConfig === 'function') &&
					!is.renderer(glConfig) &&
					!is.equ(glConfig, gl, shallowLoose)
				) {
					applyProps(gl, glConfig);
				}

				// Store events internally
				if (events && !state.events.handlers) stateToUpdate.events = events(store);

				// Check performance
				if (performance && !is.equ(performance, state.performance, shallowLoose)) {
					stateToUpdate.performance = { ...state.performance, ...performance };
				}

				store.update(stateToUpdate);

				// Check size, allow it to take on container bounds initially
				const size = computeInitialSize(canvasElement, sizeConfig);
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
}

export type NgtCanvasConfigurator = ReturnType<ReturnType<typeof injectRootInitializer>>;

function computeInitialSize(canvas: NgtCanvasElement, defaultSize?: NgtSize): NgtSize {
	if (defaultSize) return defaultSize;
	if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement && canvas.parentElement)
		return canvas.parentElement.getBoundingClientRect();
	if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas)
		return { width: canvas.width, height: canvas.height, top: 0, left: 0 };
	return { width: 0, height: 0, top: 0, left: 0 };
}

// Disposes an object and all its properties
export function dispose<TObj extends { dispose?: () => void; type?: string; [key: string]: any }>(obj: TObj) {
	if (obj.dispose && obj.type !== 'Scene') obj.dispose();
	for (const p in obj) {
		(p as any).dispose?.();
		delete obj[p];
	}
}
