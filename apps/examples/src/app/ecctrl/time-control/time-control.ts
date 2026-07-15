import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgteTimeControl } from 'angular-three-ecctrl/time';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';
import { EcctrlKeyboardPlayer } from '../shared/keyboard-player';

const TIME_SCALE = 0.35;

@Component({
	selector: 'app-ecctrl-time-control-scene',
	template: `
		<ngt-color attach="background" *args="['#1e1b4b']" />
		<ngte-time-control [timeScale]="timeScale" [maxDelta]="1 / 30" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -1, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[30, 1, 30]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#312e81" roughness="0.9" />
			</ngt-mesh>
		</ngt-object3D>

		@for (box of boxes; track box.position) {
			<ngt-object3D rigidBody [position]="box.position" [options]="{ colliders: 'cuboid' }">
				<ngt-mesh castShadow [scale]="box.scale">
					<ngt-box-geometry />
					<ngt-mesh-standard-material [color]="box.color" roughness="0.4" metalness="0.15" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<app-ecctrl-keyboard-player [position]="[0, 1.2, 5]" [animationTimeScale]="timeScale" />
	`,
	imports: [EcctrlKeyboardPlayer, NgteTimeControl, NgtArgs, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlTimeControlScene {
	protected readonly timeScale = TIME_SCALE;
	protected readonly boxes: Array<{
		position: [number, number, number];
		scale: [number, number, number];
		color: string;
	}> = [
		{ position: [-3, 6, -2], scale: [1, 1, 1], color: '#22d3ee' },
		{ position: [0, 9, -4], scale: [1.4, 0.7, 1.4], color: '#a78bfa' },
		{ position: [3, 12, -6], scale: [0.8, 1.6, 0.8], color: '#f472b6' },
	];

	constructor() {
		const controls = inject(EcctrlExampleControls);
		controls.physicsPaused.set(true);
		controls.physicsTimeStep.set('vary');
		inject(DestroyRef).onDestroy(() => {
			controls.physicsPaused.set(false);
			controls.physicsTimeStep.set(1 / 60);
		});
	}
}

@Component({
	selector: 'app-ecctrl-time-control',
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
						[shadow.camera.far]="60"
						[shadow.camera.left]="-16"
						[shadow.camera.right]="16"
						[shadow.camera.top]="16"
						[shadow.camera.bottom]="-16"
						[shadow.bias]="-0.0001"
						[shadow.normalBias]="0.02"
						[shadow.radius]="4"
						[shadow.intensity]="0.65"
					/>

					<app-ecctrl-time-control-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlExampleOverlay, EcctrlTimeControlScene, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlTimeControl {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
