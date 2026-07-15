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
import { NgtrCuboidCollider, NgtrRigidBody } from 'angular-three-rapier';
import { EcctrlExampleControls } from '../shared/example-controls';
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
export default class EcctrlCurveEditorScene {
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
