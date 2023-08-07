import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, signal } from '@angular/core';
import { NgtArgs, NgtCanvas, extend } from 'angular-three';
import { NgtsGrid } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';
import * as THREE from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-ambient-light [intensity]="Math.PI" />
		<ngt-point-light [intensity]="Math.PI" />
		<ngt-primitive *args="[bot()]" [ref]="animations.ref" [position]="[0, -1, 0]" />
		<ngts-orbit-controls />
		<ngts-grid [position]="[0, -1, 0]" [args]="[10, 10]" />
	`,
	imports: [NgtArgs, NgtsOrbitControls, NgtsGrid],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	Math = Math;

	active = signal(false);
	hover = signal(false);

	private yBotGltf = injectNgtsGLTFLoader(() => 'assets/ybot.glb');

	animations = injectNgtsAnimations(() => this.yBotGltf()?.animations || []);
	bot = computed(() => {
		const gltf = this.yBotGltf();
		if (gltf) {
			return gltf.scene;
		}
		return null;
	});
}

@Component({
	standalone: true,
	imports: [NgtCanvas, NgIf],
	selector: 'sandbox-root',
	template: ` <ngt-canvas [sceneGraph]="Scene" [camera]="{ position: [0, 1, 3] }" /> `,
})
export class AppComponent {
	readonly Scene = Scene;
}
