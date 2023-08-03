import { Component, signal } from '@angular/core';
import { NgtArgs, NgtCanvas } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';

@Component({
	standalone: true,
	templateUrl: './scene.html',
	imports: [NgtsOrbitControls, NgtArgs],
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
