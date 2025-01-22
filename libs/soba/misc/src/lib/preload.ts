import { computed, Directive, effect, ElementRef, model } from '@angular/core';
import { injectStore, resolveRef } from 'angular-three';
import * as THREE from 'three';

@Directive({ selector: 'ngts-preload' })
export class NgtsPreload {
	all = model<boolean>();
	scene = model<THREE.Object3D | ElementRef<THREE.Object3D>>();
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
