import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, signal } from '@angular/core';
import { NgtArgs, NgtCanvas, extend } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { injectNgtsAnimations } from 'angular-three-soba/misc';
import * as THREE from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-spot-light [position]="3" [castShadow]="true">
			<ngt-vector2 *args="[512, 512]" attach="shadow.mapSize" />
		</ngt-spot-light>

		<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]" [receiveShadow]="true" [position]="[0, -1, 0]">
			<ngt-plane-geometry *args="[100, 100]" />
			<ngt-shadow-material />
		</ngt-mesh>

		<ngt-primitive
			*args="[cloud()]"
			[ref]="animations.ref"
			[scale]="0.01"
			[rotation]="[0, -Math.PI / 2, 0]"
			[position]="[0, -1, 0]"
			(beforeRender)="onBeforeRender($event.object)"
		/>

		<ngts-orbit-controls />
	`,
	imports: [NgtArgs, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	Math = Math;

	active = signal(false);
	hover = signal(false);

	private cloudGltf = injectNgtsGLTFLoader(() => 'assets/cloud_from_world_of_final_fantasy/scene.gltf');

	animations = injectNgtsAnimations(() => this.cloudGltf()?.animations || []);
	cloud = computed(() => {
		const gltf = this.cloudGltf();
		if (gltf) {
			gltf.scene.traverse((child) => {
				if (child instanceof THREE.Mesh) child.castShadow = true;
			});

			return gltf.scene;
		}

		return null;
	});

	onBeforeRender(cloud: THREE.Group) {
		cloud.rotation.y += 0.005;
	}
}

@Component({
	standalone: true,
	imports: [NgtCanvas, NgIf],
	selector: 'sandbox-root',
	template: ` <ngt-canvas [sceneGraph]="Scene" [camera]="{ position: [2, 1, 3] }" [shadows]="true" /> `,
	styles: [''],
})
export class AppComponent {
	readonly Scene = Scene;
}
