import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';
import { EcctrlKeyboardPlayer } from '../shared/keyboard-player';

interface Obstacle {
	position: NgtVector3;
	scale: NgtVector3;
	color: string;
}

@Component({
	selector: 'app-ecctrl-basic-scene',
	template: `
		<ngt-color attach="background" *args="['#111827']" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -0.25, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[16, 0.5, 16]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#1e293b" roughness="0.9" />
			</ngt-mesh>
		</ngt-object3D>

		@for (obstacle of obstacles; track $index) {
			<ngt-object3D rigidBody="fixed" [position]="obstacle.position" [options]="{ colliders: 'cuboid' }">
				<ngt-mesh castShadow receiveShadow [scale]="obstacle.scale">
					<ngt-box-geometry />
					<ngt-mesh-standard-material [color]="obstacle.color" roughness="0.7" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<app-ecctrl-keyboard-player [position]="[0, 1.25, 5]" />
	`,
	imports: [EcctrlKeyboardPlayer, NgtArgs, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlBasicScene {
	protected readonly obstacles: Obstacle[] = [
		{ position: [-4, 0.75, -3], scale: [2, 1.5, 2], color: '#334155' },
		{ position: [4, 1.25, -2], scale: [1.5, 2.5, 1.5], color: '#475569' },
		{ position: [-1, 0.5, -7], scale: [5, 1, 1], color: '#0f766e' },
		{ position: [5, 0.4, 4], scale: [2.5, 0.8, 1], color: '#7c2d12' },
	];
}

@Component({
	selector: 'app-ecctrl-basic',
	template: `
		<ngt-canvas [camera]="{ position: [9, 7, 12], fov: 45 }" [lookAt]="[0, 1, 5]" shadows>
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
						[shadow.camera.left]="-12"
						[shadow.camera.right]="12"
						[shadow.camera.top]="12"
						[shadow.camera.bottom]="-12"
						[shadow.bias]="-0.0001"
						[shadow.normalBias]="0.02"
						[shadow.radius]="4"
						[shadow.intensity]="0.65"
					/>

					<app-ecctrl-basic-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlBasicScene, EcctrlExampleOverlay, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlBasic {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
