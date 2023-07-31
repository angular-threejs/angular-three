import { Injector, runInInjectionContext, signal } from '@angular/core';
import * as THREE from 'three';
import { injectNgtRoots, type NgtCanvasElement } from './roots';
import { assertInjectionContext } from './utils/assert-injection-context';

export type NgtGLOptions =
	| NgtRenderer
	| ((canvas: HTMLCanvasElement) => NgtRenderer)
	| Partial<NgtProperties<THREE.WebGLRenderer> | THREE.WebGLRendererParameters>
	| undefined;

export type NgtCanvasInputs = {
	/** A threejs renderer instance or props that go into the default renderer */
	gl?: NgtGLOptions;
	size?: NgtSize;

	/**
	 * Enables shadows (by default PCFsoft). Can accept `gl.shadowMap` options for fine-tuning,
	 * but also strings: 'basic' | 'percentage' | 'soft' | 'variance'.
	 * @see https://threejs.org/docs/#api/en/renderers/WebGLRenderer.shadowMap
	 */
	shadows?: boolean | 'basic' | 'percentage' | 'soft' | 'variance' | Partial<THREE.WebGLShadowMap>;
	/**
	 * Disables three r139 color management.
	 * @see https://threejs.org/docs/#manual/en/introduction/Color-management
	 */
	legacy?: boolean;
	/** Switch off automatic sRGB encoding and gamma correction */
	linear?: boolean;
	/** Use `THREE.NoToneMapping` instead of `THREE.ACESFilmicToneMapping` */
	flat?: boolean;
	/** Creates an orthographic camera */
	orthographic?: boolean;
	/**
	 * R3F's render mode. Set to `demand` to only render on state change or `never` to take control.
	 * @see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#on-demand-rendering
	 */
	frameloop?: 'always' | 'demand' | 'never';
	/**
	 * R3F performance options for adaptive performance.
	 * @see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#movement-regression
	 */
	performance?: Partial<Omit<NgtPerformance, 'regress'>>;
	/** Target pixel ratio. Can clamp between a range: `[min, max]` */
	dpr?: NgtDpr;
	/** Props that go into the default raycaster */
	raycaster?: Partial<THREE.Raycaster>;
	/** A `THREE.Scene` instance or props that go into the default scene */
	scene?: THREE.Scene | Partial<THREE.Scene>;
	/** A `Camera` instance or props that go into the default camera */
	camera?: (
		| NgtCamera
		| Partial<
				NgtObject3DNode<THREE.Camera, typeof THREE.Camera> &
					NgtObject3DNode<THREE.PerspectiveCamera, typeof THREE.PerspectiveCamera> &
					NgtObject3DNode<THREE.OrthographicCamera, typeof THREE.OrthographicCamera>
		  >
	) & {
		/** Flags the camera as manual, putting projection into your own hands */
		manual?: boolean;
	};
	/** An R3F event manager to manage elements' pointer events */
	events?: (store: NgtSignalStore<NgtState>) => NgtEventManager<HTMLElement>;
	/** The target where events are being subscribed to, default: the div that wraps canvas */
	eventSource?: HTMLElement | ElementRef<HTMLElement>;
	/** The event prefix that is cast into canvas pointer x/y events, default: "offset" */
	eventPrefix?: 'offset' | 'client' | 'page' | 'layer' | 'screen';
	/** Default coordinate for the camera to look at */
	lookAt?: THREE.Vector3 | Parameters<THREE.Vector3['set']>;
};

export function injectCanvasInit(injector?: Injector) {
	injector = assertInjectionContext(injectCanvasInit, injector);

	return runInInjectionContext(injector, () => {
		const roots = injectNgtRoots();

		const configured = signal(false);

		return (canvas: NgtCanvasElement) => {
			const root = roots.get(canvas);

			return {
				configure(inputs: NgtCanvasInputs) {
					let {
						gl: glConfig,
						size: propsSize,
						scene: sceneOptions,
						events,
						onCreated: onCreatedCallback,
						shadows = false,
						linear = false,
						flat = false,
						legacy = false,
						orthographic = false,
						frameloop = 'always',
						dpr = [1, 2],
						performance,
						raycaster: raycastOptions,
						camera: cameraOptions,
						onPointerMissed,
					} = props;

					let state = store.getState();

					// Set up renderer (one time only!)
					let gl = state.gl;
					if (!state.gl) state.set({ gl: (gl = createRendererInstance(glConfig, canvas)) });

					// Set up raycaster (one time only!)
					let raycaster = state.raycaster;
					if (!raycaster) state.set({ raycaster: (raycaster = new THREE.Raycaster()) });

					// Set raycaster options
					const { params, ...options } = raycastOptions || {};
					if (!is.equ(options, raycaster, shallowLoose)) applyProps(raycaster as any, { ...options });
					if (!is.equ(params, raycaster.params, shallowLoose))
						applyProps(raycaster as any, { params: { ...raycaster.params, ...params } });

					// Create default camera, don't overwrite any user-set state
					if (
						!state.camera ||
						(state.camera === lastCamera && !is.equ(lastCamera, cameraOptions, shallowLoose))
					) {
						lastCamera = cameraOptions;
						const isCamera = cameraOptions instanceof THREE.Camera;
						const camera = isCamera
							? (cameraOptions as Camera)
							: orthographic
							? new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 1000)
							: new THREE.PerspectiveCamera(75, 0, 0.1, 1000);
						if (!isCamera) {
							camera.position.z = 5;
							if (cameraOptions) applyProps(camera as any, cameraOptions as any);
							// Always look at center by default
							if (!state.camera && !cameraOptions?.rotation) camera.lookAt(0, 0, 0);
						}
						state.set({ camera });
					}

					// Set up scene (one time only!)
					if (!state.scene) {
						let scene: THREE.Scene;

						if (sceneOptions instanceof THREE.Scene) {
							scene = sceneOptions;
						} else {
							scene = new THREE.Scene();
							if (sceneOptions) applyProps(scene as any, sceneOptions as any);
						}

						state.set({ scene: prepare(scene) });
					}

					// Set up XR (one time only!)
					if (!state.xr) {
						// Handle frame behavior in WebXR
						const handleXRFrame: THREE.XRFrameRequestCallback = (
							timestamp: number,
							frame?: THREE.XRFrame,
						) => {
							const state = store.getState();
							if (state.frameloop === 'never') return;
							advance(timestamp, true, state, frame);
						};

						// Toggle render switching on session
						const handleSessionChange = () => {
							const state = store.getState();
							state.gl.xr.enabled = state.gl.xr.isPresenting;

							state.gl.xr.setAnimationLoop(state.gl.xr.isPresenting ? handleXRFrame : null);
							if (!state.gl.xr.isPresenting) invalidate(state);
						};

						// WebXR session manager
						const xr = {
							connect() {
								const gl = store.getState().gl;
								gl.xr.addEventListener('sessionstart', handleSessionChange);
								gl.xr.addEventListener('sessionend', handleSessionChange);
							},
							disconnect() {
								const gl = store.getState().gl;
								gl.xr.removeEventListener('sessionstart', handleSessionChange);
								gl.xr.removeEventListener('sessionend', handleSessionChange);
							},
						};

						// Subscribe to WebXR session events
						if (typeof gl.xr?.addEventListener === 'function') xr.connect();
						state.set({ xr });
					}

					// Set shadowmap
					if (gl.shadowMap) {
						const oldEnabled = gl.shadowMap.enabled;
						const oldType = gl.shadowMap.type;
						gl.shadowMap.enabled = !!shadows;

						if (is.boo(shadows)) {
							gl.shadowMap.type = THREE.PCFSoftShadowMap;
						} else if (is.str(shadows)) {
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
							gl.shadowMap.needsUpdate = true;
					}

					// Safely set color management if available.
					// Avoid accessing THREE.ColorManagement to play nice with older versions
					const ColorManagement = getColorManagement();
					if (ColorManagement) {
						if ('enabled' in ColorManagement) ColorManagement.enabled = !legacy;
						else if ('legacyMode' in ColorManagement) ColorManagement.legacyMode = legacy;
					}

					// Set color space and tonemapping preferences
					const LinearEncoding = 3000;
					const sRGBEncoding = 3001;
					applyProps(
						gl as any,
						{
							outputEncoding: linear ? LinearEncoding : sRGBEncoding,
							toneMapping: flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
						} as Partial<Properties<THREE.WebGLRenderer>>,
					);

					// Update color management state
					if (state.legacy !== legacy) state.set(() => ({ legacy }));
					if (state.linear !== linear) state.set(() => ({ linear }));
					if (state.flat !== flat) state.set(() => ({ flat }));

					// Set gl props
					if (glConfig && !is.fun(glConfig) && !isRenderer(glConfig) && !is.equ(glConfig, gl, shallowLoose))
						applyProps(gl as any, glConfig as any);
					// Store events internally
					if (events && !state.events.handlers) state.set({ events: events(store) });
					// Check size, allow it to take on container bounds initially
					const size = computeInitialSize(canvas, propsSize);
					if (!is.equ(size, state.size, shallowLoose)) {
						state.setSize(size.width, size.height, size.updateStyle, size.top, size.left);
					}
					// Check pixelratio
					if (dpr && state.viewport.dpr !== calculateDpr(dpr)) state.setDpr(dpr);
					// Check frameloop
					if (state.frameloop !== frameloop) state.setFrameloop(frameloop);
					// Check pointer missed
					if (!state.onPointerMissed) state.set({ onPointerMissed });
					// Check performance
					if (performance && !is.equ(performance, state.performance, shallowLoose))
						state.set((state) => ({ performance: { ...state.performance, ...performance } }));
				},
			};
		};
	});
}
