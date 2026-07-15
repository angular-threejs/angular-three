import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';
import { EcctrlKeyboardPlayer } from '../shared/keyboard-player';

@Component({
	selector: 'app-ecctrl-mobile-input-scene',
	template: `
		<ngt-color attach="background" *args="['#111827']" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -1, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[30, 1, 30]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#1f2937" roughness="0.9" />
			</ngt-mesh>
		</ngt-object3D>

		@for (position of steppingStones; track position) {
			<ngt-object3D rigidBody="fixed" [position]="position" [options]="{ colliders: 'cuboid' }">
				<ngt-mesh castShadow receiveShadow [scale]="[1.8, 0.3, 1.8]">
					<ngt-box-geometry />
					<ngt-mesh-standard-material color="#0e7490" roughness="0.5" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<app-ecctrl-keyboard-player [touchControls]="true" [position]="[0, 1.2, 4]" />
	`,
	imports: [EcctrlKeyboardPlayer, NgtArgs, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlMobileInputScene {
	protected readonly steppingStones: [number, number, number][] = [
		[-3, 0.2, 0],
		[0, 0.7, -3],
		[3, 1.2, -6],
		[0, 1.7, -9],
	];
}

@Component({
	selector: 'app-ecctrl-mobile-input',
	template: `
		<ngt-canvas [camera]="{ position: [9, 7, 12], fov: 45 }" [lookAt]="[0, 1, 4]" shadows>
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
						[shadow.camera.left]="-16"
						[shadow.camera.right]="16"
						[shadow.camera.top]="16"
						[shadow.camera.bottom]="-16"
						[shadow.bias]="-0.0001"
						[shadow.normalBias]="0.02"
						[shadow.radius]="4"
						[shadow.intensity]="0.65"
					/>

					<app-ecctrl-mobile-input-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlExampleOverlay, EcctrlMobileInputScene, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlMobileInput {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
