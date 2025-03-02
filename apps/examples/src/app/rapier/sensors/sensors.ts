import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, signal, viewChild } from '@angular/core';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { injectBeforeRender } from 'angular-three';
import { NgtrCuboidCollider, NgtrRigidBody } from 'angular-three-rapier';
import { NgtsText } from 'angular-three-soba/abstractions';
import * as THREE from 'three';
import { ResetOrbitControls } from '../reset-orbit-controls';

const material = new THREE.MeshPhysicalMaterial();

@Component({
	selector: 'app-goal',
	template: `
		<ngt-object3D rigidBody [position]="[0, 1, 0]">
			@for (goal of goalTransforms; track $index) {
				<ngt-mesh [metarial]="material" castShadow [scale]="goal.scale" [position]="goal.position">
					<ngt-box-geometry />
				</ngt-mesh>
			}

			@if (intersecting()) {
				<ngts-text text="Goal!" [options]="{ fontSize: 2 }" />
			}

			<ngt-object3D
				[cuboidCollider]="[5, 3, 1]"
				[position]="[0, 0, 1]"
				[options]="{ sensor: true }"
				(intersectionEnter)="intersecting.set(true)"
				(intersectionExit)="intersecting.set(false)"
			/>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody, NgtsText, NgtrCuboidCollider],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Goal {
	protected readonly material = material;

	protected goalTransforms = [
		{ scale: [11, 1, 1], position: [0, 3, 0] },
		{ scale: [1, 6, 1], position: [-5, 0, 0] },
		{ scale: [1, 6, 1], position: [5, 0, 0] },
		{ scale: [1, 1, 3], position: [-5, -3, 0] },
		{ scale: [1, 1, 3], position: [5, -3, 0] },
	];

	protected intersecting = signal(false);
}

@Component({
	selector: 'app-ball',
	template: `
		<ngt-object3D rigidBody [options]="{ colliders: 'ball', restitution: 1.5 }">
			<ngt-mesh [material]="material" castShadow>
				<ngt-sphere-geometry />
			</ngt-mesh>
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Ball {
	protected readonly material = material;

	private rigidBody = viewChild.required(NgtrRigidBody);

	constructor() {
		effect(() => {
			const rigidBody = this.rigidBody().rigidBody();
			if (!rigidBody) return;
			this.restart(rigidBody);
		});

		injectBeforeRender(() => {
			const rigidBody = this.rigidBody().rigidBody();
			if (!rigidBody) return;
			if (rigidBody.translation().z > 10) {
				this.restart(rigidBody);
			}
		});
	}

	private restart(rigidBody: RigidBody) {
		rigidBody.setTranslation({ x: 0, y: -7, z: -24 }, true);
		rigidBody.setLinvel({ x: 0, y: 0, z: 7 }, true);
	}
}

@Component({
	selector: 'app-rapier-sensors',
	template: `
		<ngt-group>
			<app-goal />
			<app-ball />
		</ngt-group>
	`,
	hostDirectives: [ResetOrbitControls],
	imports: [Goal, Ball],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class SensorsExample {}
