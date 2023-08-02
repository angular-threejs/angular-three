import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, signal } from '@angular/core';
import { NgtArgs, NgtBeforeRenderEvent, NgtCanvas, extend, injectNgtLoader } from 'angular-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<!-- <ngt-spot-light #spotLight [position]="2" [intensity]="10" /> -->
		<!-- <ngt-spot-light-helper *args="[spotLight, 'blue']" /> -->
		<!---->
		<!-- <ngt-point-light #pointLight [position]="-2" [intensity]="10" /> -->
		<!-- <ngt-point-light-helper *args="[pointLight, 1, 'green']" /> -->

		<!-- <ngt-mesh -->
		<!-- 	(click)="active.set(!active())" -->
		<!-- 	(pointerover)="hover.set(true)" -->
		<!-- 	(pointerout)="hover.set(false)" -->
		<!-- 	(beforeRender)="onBeforeRender($event.object)" -->
		<!-- 	[scale]="active() ? 1.5 : 1" -->
		<!-- > -->
		<!-- 	<ngt-box-geometry /> -->
		<!-- 	<ngt-mesh-standard-material [color]="hover() ? 'hotpink' : 'orange'" /> -->
		<!-- </ngt-mesh> -->

		<ngt-spot-light [position]="3" [castShadow]="true">
			<ngt-vector2 *args="[512, 512]" attach="shadow.mapSize" />
		</ngt-spot-light>

		<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]" [receiveShadow]="true" [position]="[0, -1, 0]">
			<ngt-plane-geometry *args="[100, 100]" />
			<ngt-shadow-material />
		</ngt-mesh>

		<ngt-primitive
			*args="[cloud()]"
			[scale]="0.01"
			[rotation]="[0, -Math.PI / 2, 0]"
			[position]="[0, -1, 0]"
			(beforeRender)="onBeforeRender($event)"
		/>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	Math = Math;

	active = signal(false);
	hover = signal(false);

	cloudGltf = injectNgtLoader(
		() => GLTFLoader,
		() => 'assets/cloud_from_world_of_final_fantasy/scene.gltf',
	);

	mixer?: THREE.AnimationMixer;

	cloud = computed(() => {
		const gltf = this.cloudGltf();
		if (gltf) {
			gltf.scene.traverse((child) => {
				if (child instanceof THREE.Mesh) child.castShadow = true;
			});

			this.mixer = new THREE.AnimationMixer(gltf.scene);
			this.mixer.clipAction(gltf.animations[0]).play();

			return gltf.scene;
		}

		return null;
	});

	onBeforeRender({ object: cloud, state: { delta } }: NgtBeforeRenderEvent) {
		cloud.rotation.y += 0.005;
		this.mixer?.update(delta);
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
