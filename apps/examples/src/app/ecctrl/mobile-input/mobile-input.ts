import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
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
export default class EcctrlMobileInputScene {
	protected readonly steppingStones: [number, number, number][] = [
		[-3, 0.2, 0],
		[0, 0.7, -3],
		[3, 1.2, -6],
		[0, 1.7, -9],
	];
}
