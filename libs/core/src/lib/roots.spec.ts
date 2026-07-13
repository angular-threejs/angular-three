import { Injector } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import * as THREE from 'three';
import { NGT_LOOP, roots } from './loop';
import { canvasRootInitializer, type NgtCanvasConfigurator } from './roots';
import { NGT_STORE, storeFactory } from './store';
import type { NgtCanvasOptions, NgtState } from './types';
import type { SignalState } from './utils/signal-state';

function createRenderer() {
	return {
		render: vi.fn(),
		setClearAlpha: vi.fn(),
		setPixelRatio: vi.fn(),
		setSize: vi.fn(),
		renderLists: { dispose: vi.fn() },
		dispose: vi.fn(),
		forceContextLoss: vi.fn(),
		xr: {
			enabled: false,
			isPresenting: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			setAnimationLoop: vi.fn(),
		},
	} as unknown as THREE.WebGLRenderer;
}

describe('canvas roots', () => {
	let store: SignalState<NgtState>;
	let initRoot: ReturnType<typeof canvasRootInitializer>;

	beforeEach(() => {
		roots.clear();
		TestBed.configureTestingModule({
			providers: [
				{
					provide: NGT_LOOP,
					useValue: { advance: vi.fn(), invalidate: vi.fn(), loop: vi.fn() },
				},
				{ provide: NGT_STORE, useFactory: storeFactory },
			],
		});
		store = TestBed.inject(NGT_STORE);
		initRoot = canvasRootInitializer(TestBed.inject(Injector));
	});

	afterEach(() => roots.clear());

	function configure(
		canvas: HTMLCanvasElement,
		inputs: Partial<NgtCanvasOptions> = {},
	): { configurator: NgtCanvasConfigurator; gl: THREE.WebGLRenderer } {
		const configurator = initRoot(canvas);
		const gl = createRenderer();
		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			...inputs,
		});
		return { configurator, gl };
	}

	it('reports configuration state and replaces a managed camera when its options change', () => {
		const canvas = document.createElement('canvas');
		const configurator = initRoot(canvas);
		const gl = createRenderer();

		expect(configurator.isConfigured).toBe(false);
		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: { fov: 50, position: [0, 1, 5] },
		});
		const firstCamera = store.snapshot.camera;
		expect(configurator.isConfigured).toBe(true);
		expect(firstCamera).toBeInstanceOf(THREE.PerspectiveCamera);
		expect((firstCamera as THREE.PerspectiveCamera).fov).toBe(50);

		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: { fov: 65, position: [0, 1, 5] },
		});

		expect(store.snapshot.camera).not.toBe(firstCamera);
		expect((store.snapshot.camera as THREE.PerspectiveCamera).fov).toBe(65);
		expect(store.snapshot.raycaster.camera).toBe(store.snapshot.camera);
	});

	it('replaces a managed camera when projection mode changes', () => {
		const canvas = document.createElement('canvas');
		const { configurator, gl } = configure(canvas, { camera: { position: [0, 0, 5] } });
		const perspectiveCamera = store.snapshot.camera;

		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: { position: [0, 0, 5] },
			orthographic: true,
		});

		expect(perspectiveCamera).toBeInstanceOf(THREE.PerspectiveCamera);
		expect(store.snapshot.camera).toBeInstanceOf(THREE.OrthographicCamera);
	});

	it('keeps an equivalent managed camera and accepts a later explicit camera', () => {
		const canvas = document.createElement('canvas');
		const { configurator, gl } = configure(canvas, {
			camera: { fov: 50, position: [0, 1, 5] },
			lookAt: [0, 0, 0],
		});
		const managedCamera = store.snapshot.camera;

		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: { fov: 50, position: [0, 1, 5] },
			lookAt: [0, 0, 0],
		});
		expect(store.snapshot.camera).toBe(managedCamera);

		const explicitCamera = new THREE.PerspectiveCamera(35);
		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: explicitCamera,
		});

		expect(store.snapshot.camera).toBe(explicitCamera);
		expect(store.snapshot.raycaster.camera).toBe(explicitCamera);
	});

	it('does not overwrite a camera installed directly in the store', () => {
		const canvas = document.createElement('canvas');
		const { configurator, gl } = configure(canvas, { camera: { fov: 50 } });
		const externalCamera = new THREE.PerspectiveCamera(35);
		store.update({ camera: externalCamera });

		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: { fov: 70 },
		});

		expect(store.snapshot.camera).toBe(externalCamera);
	});

	it('applies the latest managed camera configuration when an external override releases', () => {
		const canvas = document.createElement('canvas');
		const { configurator, gl } = configure(canvas, { camera: { fov: 50 } });
		const originalManagedCamera = store.snapshot.camera;
		const externalCamera = new THREE.PerspectiveCamera(35);
		store.update({ camera: externalCamera });

		configurator.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
			camera: { fov: 70 },
		});
		expect(store.snapshot.camera).toBe(externalCamera);

		store.update({ camera: originalManagedCamera });
		TestBed.flushEffects();
		expect(store.snapshot.camera).not.toBe(originalManagedCamera);
		expect(store.snapshot.camera).toBeInstanceOf(THREE.PerspectiveCamera);
		expect((store.snapshot.camera as THREE.PerspectiveCamera).fov).toBe(70);
		expect(store.snapshot.raycaster.camera).toBe(store.snapshot.camera);
	});

	it('destroys a root once and cancels its pending performance restoration', fakeAsync(() => {
		const canvas = document.createElement('canvas');
		const { configurator, gl } = configure(canvas, {
			performance: { min: 0.25, max: 0.9, debounce: 100 },
		});
		const disconnect = vi.fn();
		store.update((state) => ({
			events: { ...state.events, disconnect },
			internal: { ...state.internal, active: true },
		}));
		store.snapshot.performance.regress();
		expect(store.snapshot.performance.current).toBe(0.25);

		configurator.destroy(10);
		configurator.destroy(10);
		expect(store.snapshot.internal.active).toBe(false);
		tick(100);
		configurator.destroy(0);
		tick(0);

		expect(disconnect).toHaveBeenCalledTimes(1);
		expect(gl.renderLists.dispose).toHaveBeenCalledTimes(1);
		expect(gl.dispose).toHaveBeenCalledTimes(1);
		expect(gl.forceContextLoss).toHaveBeenCalledTimes(1);
		expect(store.snapshot.performance.current).toBe(0.25);
		expect(roots.has(canvas)).toBe(false);
	}));

	it('cancels a stale teardown when the same canvas is reacquired', fakeAsync(() => {
		const canvas = document.createElement('canvas');
		const { configurator: first, gl } = configure(canvas);
		store.update((state) => ({ internal: { ...state.internal, active: true } }));
		first.destroy(50);

		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const second = initRoot(canvas);
		second.configure({
			gl,
			size: { width: 200, height: 100, top: 0, left: 0 },
		});
		store.update((state) => ({ internal: { ...state.internal, active: true } }));
		tick(50);

		expect(roots.get(canvas)).toBe(store);
		expect(gl.dispose).not.toHaveBeenCalled();
		expect(store.snapshot.internal.active).toBe(true);

		second.destroy(0);
		tick(0);
		expect(gl.dispose).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	}));

	it('restores regressed performance when a pending teardown is canceled', fakeAsync(() => {
		const canvas = document.createElement('canvas');
		const { configurator: first, gl } = configure(canvas, {
			performance: { min: 0.2, max: 0.8, debounce: 100 },
		});
		store.snapshot.performance.regress();
		expect(store.snapshot.performance.current).toBe(0.2);
		first.destroy(50);

		const second = initRoot(canvas);
		second.configure({ gl, size: { width: 200, height: 100, top: 0, left: 0 } });
		store.update((state) => ({ internal: { ...state.internal, active: true } }));
		expect(store.snapshot.performance.current).toBe(0.8);
		tick(100);
		expect(roots.get(canvas)).toBe(store);
		expect(store.snapshot.performance.current).toBe(0.8);
		expect(gl.dispose).not.toHaveBeenCalled();

		second.destroy(0);
		tick(0);
	}));

	it('attempts every root cleanup even when earlier cleanup operations throw', fakeAsync(() => {
		const canvas = document.createElement('canvas');
		const { configurator, gl } = configure(canvas);
		const disconnectError = new Error('disconnect failed');
		const disposeError = new Error('renderer dispose failed');
		const disconnect = vi.fn(() => {
			throw disconnectError;
		});
		vi.mocked(gl.dispose).mockImplementation(() => {
			throw disposeError;
		});
		const sceneResource = { dispose: vi.fn() };
		Object.assign(store.snapshot.scene, { sceneResource });
		store.update((state) => ({ events: { ...state.events, disconnect } }));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		configurator.destroy(0);
		tick(0);

		expect(disconnect).toHaveBeenCalledOnce();
		expect(gl.renderLists.dispose).toHaveBeenCalledOnce();
		expect(gl.dispose).toHaveBeenCalledOnce();
		expect(gl.forceContextLoss).toHaveBeenCalledOnce();
		expect(gl.xr.removeEventListener).toHaveBeenCalledTimes(2);
		expect(sceneResource.dispose).toHaveBeenCalledOnce();
		expect(consoleError).toHaveBeenCalledWith('[NGT] Errors while destroying Canvas Root', [
			disconnectError,
			disposeError,
		]);
		expect(roots.has(canvas)).toBe(false);
		consoleError.mockRestore();
	}));
});
