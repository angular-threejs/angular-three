import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgteTimeControl } from 'angular-three-ecctrl/time';
import { NgtrRigidBody } from 'angular-three-rapier';
import { EcctrlExampleControls } from '../shared/example-controls';
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
export default class EcctrlTimeControlScene {
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
