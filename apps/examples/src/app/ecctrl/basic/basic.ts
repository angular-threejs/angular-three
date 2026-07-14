import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, viewChild } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { NgteEcctrl } from 'angular-three-ecctrl';
import { NgtrRigidBody } from 'angular-three-rapier';
import { createKeyboardControls, NgtsKeyboardControls } from 'angular-three-soba/controls';

interface Obstacle {
	position: NgtVector3;
	scale: NgtVector3;
	color: string;
}

const { controlsMap } = createKeyboardControls([
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'backward', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
	{ name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
	{ name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
	{ name: 'jump', keys: ['Space'] },
]);

@Component({
	selector: 'app-ecctrl-basic',
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

		<ngt-group [keyboardControls]="controlsMap" preventDefault>
			<ngte-ecctrl [position]="[0, 1.25, 5]" [options]="{ enableToggleRun: false }">
				<ngt-group [position]="[0, 0.15, 0]">
					<ngt-mesh castShadow receiveShadow>
						<ngt-capsule-geometry *args="[0.3, 0.6, 8, 16]" />
						<ngt-mesh-standard-material color="#fb923c" roughness="0.35" metalness="0.1" />
					</ngt-mesh>
					<ngt-mesh [position]="[0, 0.5, -0.2]">
						<ngt-sphere-geometry *args="[0.08, 16, 16]" />
						<ngt-mesh-basic-material color="#fef3c7" />
					</ngt-mesh>
				</ngt-group>
			</ngte-ecctrl>
		</ngt-group>
	`,
	imports: [NgtArgs, NgteEcctrl, NgtrRigidBody, NgtsKeyboardControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EcctrlBasic {
	protected readonly controlsMap = controlsMap;
	protected readonly obstacles: Obstacle[] = [
		{ position: [-4, 0.75, -3], scale: [2, 1.5, 2], color: '#334155' },
		{ position: [4, 1.25, -2], scale: [1.5, 2.5, 1.5], color: '#475569' },
		{ position: [-1, 0.5, -7], scale: [5, 1, 1], color: '#0f766e' },
		{ position: [5, 0.4, 4], scale: [2.5, 0.8, 1], color: '#7c2d12' },
	];

	private readonly keyboardControls = viewChild(NgtsKeyboardControls);
	private readonly ecctrl = viewChild(NgteEcctrl);

	constructor() {
		effect(() => {
			const keyboardControls = this.keyboardControls();
			const ecctrl = this.ecctrl();
			if (!keyboardControls || !ecctrl) return;

			ecctrl.setMovement({
				forward: keyboardControls.select('forward')(),
				backward: keyboardControls.select('backward')(),
				leftward: keyboardControls.select('leftward')(),
				rightward: keyboardControls.select('rightward')(),
				run: keyboardControls.select('run')(),
				jump: keyboardControls.select('jump')(),
			});
		});
	}
}
