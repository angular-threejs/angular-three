import { computed, Directive, effect, ElementRef, model } from '@angular/core';
import { injectStore, resolveRef } from 'angular-three';
import * as THREE from 'three';

/**
 * Pre-compiles shaders and textures to reduce runtime jank.
 *
 * When added to a scene, this directive triggers `WebGLRenderer.compile()`
 * and uses a CubeCamera to ensure environment maps are also compiled.
 * This helps eliminate shader compilation stutters during initial rendering.
 *
 * @example
 * ```html
 * <!-- Preload entire scene -->
 * <ngts-preload [all]="true" />
 *
 * <!-- Preload specific scene/camera -->
 * <ngts-preload [scene]="customScene" [camera]="customCamera" />
 * ```
 */
@Directive({ selector: 'ngts-preload' })
export class NgtsPreload {
	/**
	 * When `true`, temporarily makes all invisible objects visible
	 * during compilation to ensure everything is preloaded.
	 */
	all = model<boolean>();

	/**
	 * Custom scene to preload. Defaults to the store's scene.
	 */
	scene = model<THREE.Object3D | ElementRef<THREE.Object3D>>();

	/**
	 * Custom camera to use for compilation. Defaults to the store's camera.
	 */
	camera = model<THREE.Camera | ElementRef<THREE.Camera>>();

	private store = injectStore();

	private trueScene = computed(() => {
		const scene = this.scene();
		if (scene) return resolveRef(scene);
		return this.store.scene();
	});

	private trueCamera = computed(() => {
		const camera = this.camera();
		if (camera) return resolveRef(camera);
		return this.store.camera();
	});

	constructor() {
		effect(() => {
			const invisible: THREE.Object3D[] = [];

			const [all, scene, camera, gl] = [this.all(), this.trueScene(), this.trueCamera(), this.store.gl()];

			if (!scene || !camera) return;

			if (all) {
				// Find all invisible objects, store and then flip them
				scene.traverse((object) => {
					if (!object.visible) {
						invisible.push(object);
						object.visible = true;
					}
				});
			}

			// Now compile the scene
			gl.compile(scene, camera);

			// And for good measure, hit it with a cube camera
			const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
			const cubeCamera = new THREE.CubeCamera(0.01, 100000, cubeRenderTarget);
			cubeCamera.update(gl, scene);
			cubeRenderTarget.dispose();

			// Flips these objects back
			invisible.forEach((object) => (object.visible = false));
		});
	}
}
