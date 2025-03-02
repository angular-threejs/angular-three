import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
import * as THREE from 'three';
import { ResetOrbitControls } from '../reset-orbit-controls';

@Component({
	selector: 'app-ball',
	template: `
		<ngt-object3D rigidBody [options]="{ colliders: 'ball' }">
			<ngt-mesh castShadow receiveShadow>
				<ngt-sphere-geometry />
				<ngt-mesh-physical-material color="red" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrRigidBody],
})
export class Ball {
	private rigidBodyRef = viewChild.required(NgtrRigidBody);

	constructor() {
		injectBeforeRender(() => {
			const rigidBody = this.rigidBodyRef().rigidBody();
			if (!rigidBody) return;
			if (rigidBody.translation().y < -10) {
				rigidBody.setTranslation({ x: Math.random() * 2, y: 20, z: 0 }, true);
				rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
			}
		});
	}
}

@Component({
	selector: 'app-kinematics-rapier',
	template: `
		<ngt-group>
			<app-ball />
			<app-ball />
			<app-ball />
			<app-ball />
			<app-ball />

			<ngt-object3D
				#torus="rigidBody"
				rigidBody="kinematicPosition"
				[options]="{ colliders: 'trimesh', restitution: 1 }"
				[position]="[0, 2, 0]"
			>
				<ngt-mesh castShadow receiveShadow [scale]="5">
					<ngt-torus-geometry />
					<ngt-mesh-physical-material />
				</ngt-mesh>
			</ngt-object3D>

			<ngt-object3D
				#platform="rigidBody"
				rigidBody="kinematicPosition"
				[options]="{ colliders: 'cuboid' }"
				[position]="[0, -8, 0]"
			>
				<ngt-mesh castShadow receiveShadow>
					<ngt-box-geometry *args="[40, 1, 40]" />
					<ngt-mesh-physical-material />
				</ngt-mesh>
			</ngt-object3D>
		</ngt-group>
	`,
	hostDirectives: [ResetOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [Ball, NgtrRigidBody, NgtArgs],
})
export default class KinematicsExample {
	private torusRef = viewChild.required('torus', { read: NgtrRigidBody });
	private platformRef = viewChild.required('platform', { read: NgtrRigidBody });

	constructor() {
		injectBeforeRender(() => {
			const now = performance.now();

			const torus = this.torusRef().rigidBody();
			if (torus) {
				const euler = new THREE.Euler(now / 1000, 0, 0);
				torus.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(euler));
			}

			const platform = this.platformRef().rigidBody();
			if (platform) {
				platform.setNextKinematicTranslation({
					x: Math.sin(now / 100),
					y: -8 + Math.sin(now / 50) * 0.5,
					z: 0,
				});
			}
		});
	}
}
