import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	type ElementRef,
	input,
	viewChild,
	viewChildren,
} from '@angular/core';
import type { Triplet } from '@pmndrs/cannon-worker-api';
import { extend, injectStore, NgtArgs, NgtCanvas, type NgtVector3 } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { injectBox, injectPlane } from 'angular-three-cannon/body';
import { NgtcDebug } from 'angular-three-cannon/debug';
import type { Mesh } from 'three';
import * as THREE from 'three';

extend(THREE);

@Component({
	selector: 'app-plane',
	standalone: true,
	template: `
		<ngt-mesh #mesh [receiveShadow]="true">
			<ngt-plane-geometry *args="[1000, 1000]" />
			<ngt-shadow-material color="#171717" [transparent]="true" [opacity]="0.4" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Plane {
	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	constructor() {
		injectPlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -2.5, 0] }), this.meshRef);
	}
}

@Component({
	selector: 'app-cube',
	standalone: true,
	template: `
		<ngt-mesh #mesh [receiveShadow]="true" [castShadow]="true">
			<ngt-box-geometry />
			<ngt-mesh-lambert-material color="hotpink" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {
	position = input<NgtVector3>([0, 5, 0]);

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	boxApi = injectBox(
		() => ({ mass: 1, position: this.position() as Triplet, rotation: [0.4, 0.2, 0.5], args: [1, 1, 1] }),
		this.meshRef,
	);
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['lightblue']" />
		<ngt-ambient-light />
		<ngt-directional-light [position]="10" [castShadow]="true">
			<ngt-vector2 *args="[2048, 2048]" attach="shadow.mapSize" />
		</ngt-directional-light>
		<ngtc-physics [debug]="{ enabled: true, color: 'red', scale: 1.1 }">
			<app-plane />
			@for (position of cubePositions; track $index) {
				<app-cube [position]="position" />
			}
		</ngtc-physics>
	`,
	imports: [Plane, Cube, NgtArgs, NgtcPhysics, NgtcDebug],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	cubePositions: Triplet[] = [
		[0.1, 5, 0],
		[0, 10, -1],
		[0, 20, -2],
	];

	cubes = viewChildren(Cube);

	constructor() {
		const store = injectStore();

		effect((onCleanup) => {
			const cubes = this.cubes();
			if (!cubes.length) return;

			const sub = store.snapshot.pointerMissed$.subscribe(() => {
				cubes.forEach((cube, index) => {
					cube.boxApi()?.position.set(...this.cubePositions[index]);
					cube.boxApi()?.rotation.set(0.4, 0.2, 0.5);
				});
			});
			onCleanup(() => sub.unsubscribe());
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			[camera]="{ position: [-1, 5, 5], fov: 45 }"
			[shadows]="true"
			[dpr]="[1, 2]"
			[gl]="{ alpha: false }"
		/>
		<span class="absolute bottom-0 right-0 font-mono text-black">* click to reset the cubes</span>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
	host: { class: 'cannon-sample relative inline' },
})
export default class CannonSampleDebug {
	sceneGraph = SceneGraph;
}
