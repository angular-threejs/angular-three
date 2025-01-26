import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { extend, NgtArgs, type NgtVector3 } from 'angular-three';
import { NgtrCuboidCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import * as THREE from 'three';

@Component({
	selector: 'app-floor',
	template: `
		<ngt-object3D rigidBody="fixed" [options]="{ colliders: false }" [position]="[0, -1, 0]">
			<ngt-object3D cuboidCollider [args]="[1000, 1, 1000]" />
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody, NgtrCuboidCollider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Floor {}

@Component({
	selector: 'app-box',
	template: `
		<ngt-object3D rigidBody [position]="position()">
			<ngt-mesh castShadow receiveShadow>
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="hotpink" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Box {
	position = input<NgtVector3>([0, 5, 0]);
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color attach="background" *args="['lightblue']" />
		<ngt-ambient-light />
		<ngt-directional-light [position]="10" castShadow>
			<ngt-vector2 *args="[2048, 2048]" attach="shadow.mapSize" />
		</ngt-directional-light>

		<ngtr-physics>
			<ng-template>
				<app-floor />
				@for (position of positions; track $index) {
					<app-box [position]="position" />
				}
			</ng-template>
		</ngtr-physics>
	`,
	imports: [NgtArgs, NgtrPhysics, Floor, Box],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {
	positions: NgtVector3[] = [
		[0.1, 5, 0],
		[0, 10, -1],
		[0, 20, -2],
	];

	constructor() {
		extend(THREE);
	}
}
