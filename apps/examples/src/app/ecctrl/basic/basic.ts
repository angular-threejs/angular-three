import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
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
export default class EcctrlBasicScene {
	protected readonly obstacles: Obstacle[] = [
		{ position: [-4, 0.75, -3], scale: [2, 1.5, 2], color: '#334155' },
		{ position: [4, 1.25, -2], scale: [1.5, 2.5, 1.5], color: '#475569' },
		{ position: [-1, 0.5, -7], scale: [5, 1, 1], color: '#0f766e' },
		{ position: [5, 0.4, 4], scale: [2.5, 0.8, 1], color: '#7c2d12' },
	];
}
