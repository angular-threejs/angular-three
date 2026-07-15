import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import type { NgteEcctrlOptions } from 'angular-three-ecctrl';
import { NgteEcctrlGravity, NgteEcctrlGravityBody } from 'angular-three-ecctrl/gravity';
import { NgtrBallCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';
import { EcctrlKeyboardPlayer } from '../shared/keyboard-player';

interface Star {
	position: NgtVector3;
	scale: number;
}

interface Satellite {
	position: [number, number, number];
	velocity: [number, number, number];
	color: string;
}

@Component({
	selector: 'app-ecctrl-gravity-field-scene',
	template: `
		<ngt-color attach="background" *args="['#09090b']" />

		<ngt-object3D rigidBody="fixed" [options]="{ colliders: false }">
			<ngt-object3D [ballCollider]="[5]" [options]="{ friction: 1.1 }" />
			<ngt-mesh castShadow receiveShadow>
				<ngt-sphere-geometry *args="[5, 64, 48]" />
				<ngt-mesh-standard-material color="#14532d" roughness="0.9" />
			</ngt-mesh>
		</ngt-object3D>
		<ngt-mesh [scale]="1.02">
			<ngt-sphere-geometry *args="[5, 64, 48]" />
			<ngt-mesh-basic-material color="#22c55e" transparent [opacity]="0.11" />
		</ngt-mesh>

		<ngt-group [rotation]="[Math.PI / 2.9, 0, -0.4]">
			<ngt-mesh>
				<ngt-torus-geometry *args="[6.6, 0.06, 12, 72]" />
				<ngt-mesh-basic-material color="#67e8f9" transparent [opacity]="0.7" />
			</ngt-mesh>
			<ngt-mesh [scale]="[1.1, 1, 1.1]">
				<ngt-torus-geometry *args="[6.6, 0.025, 8, 72]" />
				<ngt-mesh-basic-material color="#facc15" />
			</ngt-mesh>
		</ngt-group>

		@for (star of stars; track star.position) {
			<ngt-mesh [position]="star.position" [scale]="star.scale">
				<ngt-sphere-geometry *args="[0.08, 8, 8]" />
				<ngt-mesh-basic-material color="#e0f2fe" />
			</ngt-mesh>
		}

		@for (satellite of satellites; track satellite.position) {
			<ngt-object3D
				rigidBody
				[ecctrlGravity]="{}"
				[position]="satellite.position"
				[options]="{ canSleep: false, colliders: 'ball', linearVelocity: satellite.velocity }"
			>
				<ngt-mesh castShadow receiveShadow [scale]="0.35">
					<ngt-icosahedron-geometry *args="[1, 2]" />
					<ngt-mesh-standard-material [color]="satellite.color" roughness="0.35" metalness="0.25" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<ngt-point-light [position]="[4, 7, 6]" [intensity]="120" color="#bbf7d0" />
		<app-ecctrl-keyboard-player [position]="[0, 6.1, 0]" [options]="playerOptions" cameraUpMode="character" />
	`,
	imports: [EcctrlKeyboardPlayer, NgteEcctrlGravityBody, NgtArgs, NgtrBallCollider, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlGravityFieldScene {
	protected readonly Math = Math;
	protected readonly playerOptions: NgteEcctrlOptions = {
		enableToggleRun: false,
		enableCustomGravity: true,
		useCharacterUpAxis: true,
		gravityDirLerpSpeed: 10,
		maxWalkVel: 2.5,
		maxRunVel: 4.5,
	};
	protected readonly stars: Star[] = [
		{ position: [-9, 8, -7], scale: 1.5 },
		{ position: [7, 11, -10], scale: 0.9 },
		{ position: [-12, -2, -8], scale: 1.2 },
		{ position: [10, 3, 8], scale: 1.8 },
		{ position: [-5, 13, 3], scale: 0.7 },
		{ position: [2, -10, -4], scale: 1.1 },
		{ position: [12, -5, 2], scale: 0.8 },
	];
	protected readonly satellites: Satellite[] = [
		{ position: [8, 0, 0], velocity: [0, 0, 10.2], color: '#fbbf24' },
		{ position: [0, 0, 9], velocity: [-10.8, 0, 0], color: '#f472b6' },
		{ position: [0, -8.5, 0], velocity: [9.8, 0, 0], color: '#60a5fa' },
	];

	constructor() {
		const controls = inject(EcctrlExampleControls);
		const gravity = inject(NgteEcctrlGravity);
		const previousGravityField = gravity.gravityField();
		gravity.setGravityField((position) => {
			const distance = position.length();
			return distance > 1e-4 ? position.clone().multiplyScalar(-13 / distance) : new THREE.Vector3(0, -13, 0);
		});
		controls.physicsGravity.set([0, 0, 0]);
		inject(DestroyRef).onDestroy(() => {
			gravity.setGravityField(previousGravityField);
			controls.physicsGravity.set([0, -9.81, 0]);
		});
	}
}

@Component({
	selector: 'app-ecctrl-gravity-field',
	template: `
		<ngt-canvas [camera]="{ position: [9, 7, 12], fov: 45 }" [lookAt]="[0, 5, 0]" shadows>
			<ngtr-physics
				*canvasContent
				[options]="{
					paused: controls.physicsPaused(),
					gravity: controls.physicsGravity(),
					timeStep: controls.physicsTimeStep(),
				}"
			>
				<ng-template>
					<ngt-ambient-light [intensity]="0.5 * Math.PI" />
					<ngt-directional-light
						castShadow
						[position]="[8, 12, 6]"
						[intensity]="2 * Math.PI"
						[shadow.mapSize.width]="2048"
						[shadow.mapSize.height]="2048"
						[shadow.camera.near]="0.5"
						[shadow.camera.far]="50"
						[shadow.camera.left]="-14"
						[shadow.camera.right]="14"
						[shadow.camera.top]="14"
						[shadow.camera.bottom]="-14"
						[shadow.bias]="-0.0001"
						[shadow.normalBias]="0.02"
						[shadow.radius]="4"
						[shadow.intensity]="0.65"
					/>

					<app-ecctrl-gravity-field-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlExampleOverlay, EcctrlGravityFieldScene, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlGravityField {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
