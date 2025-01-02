import { computed, Directive, effect, ElementRef, model } from '@angular/core';
import { injectStore, resolveRef } from 'angular-three';
import { Camera, CubeCamera, Object3D, WebGLCubeRenderTarget } from 'three';

@Directive({ selector: 'ngts-preload', standalone: true })
export class NgtsPreload {
	all = model<boolean>();
	scene = model<Object3D | ElementRef<Object3D>>();
	camera = model<Camera | ElementRef<Camera>>();

	private store = injectStore();
	private gl = this.store.select('gl');
	private defaultScene = this.store.select('scene');
	private defaultCamera = this.store.select('camera');

	private trueScene = computed(() => {
		const scene = this.scene();
		if (scene) return resolveRef(scene);
		return this.defaultScene();
	});
	private trueCamera = computed(() => {
		const camera = this.camera();
		if (camera) return resolveRef(camera);
		return this.defaultCamera();
	});

	constructor() {
		effect(() => {
			const invisible: Object3D[] = [];

			const [all, scene, camera, gl] = [this.all(), this.trueScene(), this.trueCamera(), this.gl()];

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
			const cubeRenderTarget = new WebGLCubeRenderTarget(128);
			const cubeCamera = new CubeCamera(0.01, 100000, cubeRenderTarget);
			cubeCamera.update(gl, scene);
			cubeRenderTarget.dispose();

			// Flips these objects back
			invisible.forEach((object) => (object.visible = false));
		});
	}
}
