import { Component, signal } from '@angular/core';
import { NgtCanvas } from 'angular-three';

@Component({
	standalone: true,
	templateUrl: './scene.html',
})
class Scene {
	hover = signal(false);

	onBeforeRender(cube: THREE.Mesh) {
		cube.rotation.x += 0.01;
	}
}

@Component({
	standalone: true,
	templateUrl: './index.html',
	imports: [NgtCanvas],
})
export default class Cubes {
	sceneGraph = Scene;
}
