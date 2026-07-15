import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	inject,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import type { NgteEcctrlOptions } from 'angular-three-ecctrl';
import { NgtrCuboidCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';
import { EcctrlKeyboardPlayer } from '../shared/keyboard-player';

@Component({
	selector: 'app-ecctrl-curve-editor-scene',
	template: `
		<ngt-color attach="background" *args="['#042f2e']" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -2, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[30, 1, 30]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#134e4a" roughness="0.9" />
			</ngt-mesh>
		</ngt-object3D>

		<ngt-object3D rigidBody [position]="[0, 0, 0]" [options]="{ colliders: false, lockRotations: true }">
			<ngt-object3D [cuboidCollider]="[3, 0.25, 3]" [options]="{ friction: 1.1, mass: 18 }" />
			<ngt-mesh castShadow receiveShadow [scale]="[6, 0.5, 6]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#14b8a6" roughness="0.35" metalness="0.15" />
			</ngt-mesh>
		</ngt-object3D>

		<app-ecctrl-keyboard-player [position]="[0, 1.2, 0]" [options]="playerOptions()" />
	`,
	imports: [EcctrlKeyboardPlayer, NgtArgs, NgtrCuboidCollider, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlCurveEditorScene {
	private readonly controls = inject(EcctrlExampleControls);
	protected readonly playerOptions = computed<NgteEcctrlOptions>(() => ({
		enableToggleRun: false,
		followPlatform: true,
		applyCounterMass: true,
		applyCounterMoveImp: true,
		massRatioFallOffCurveData: this.controls.curve(),
	}));

	constructor() {
		this.controls.curveActive.set(true);
		inject(DestroyRef).onDestroy(() => this.controls.curveActive.set(false));
	}
}

@Component({
	selector: 'app-ecctrl-curve-editor',
	template: `
		<ngt-canvas [camera]="{ position: [9, 7, 12], fov: 45 }" [lookAt]="[0, 1, 0]" shadows>
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

					<app-ecctrl-curve-editor-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlCurveEditorScene, EcctrlExampleOverlay, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlCurveEditor {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
