import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, viewChild } from '@angular/core';
import { beforeRender, NgtArgs } from 'angular-three';
import type { NgteEcctrlOptions } from 'angular-three-ecctrl';
import { NgtrCuboidCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';
import { EcctrlKeyboardPlayer } from '../shared/keyboard-player';

@Component({
	selector: 'app-ecctrl-moving-platform-scene',
	template: `
		<ngt-color attach="background" *args="['#172554']" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -3, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[30, 1, 30]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#0f172a" roughness="0.92" />
			</ngt-mesh>
		</ngt-object3D>

		<ngt-object3D
			#turntable="rigidBody"
			rigidBody="kinematicPosition"
			[position]="[0, 0, 0]"
			[options]="{ colliders: false }"
		>
			<ngt-object3D [cuboidCollider]="[3, 0.25, 3]" [options]="{ friction: 1.2 }" />
			<ngt-mesh castShadow receiveShadow>
				<ngt-cylinder-geometry *args="[3, 3, 0.5, 48]" />
				<ngt-mesh-standard-material color="#0284c7" roughness="0.42" metalness="0.2" />
			</ngt-mesh>
			<ngt-mesh [position]="[0, 0.28, 0]">
				<ngt-torus-geometry *args="[2.15, 0.07, 12, 48]" />
				<ngt-mesh-basic-material color="#facc15" />
			</ngt-mesh>
		</ngt-object3D>

		<ngt-object3D
			#shuttle="rigidBody"
			rigidBody="kinematicPosition"
			[position]="[7, 1.8, 0]"
			[options]="{ colliders: false }"
		>
			<ngt-object3D [cuboidCollider]="[2.75, 0.225, 1.3]" [options]="{ friction: 1.2 }" />
			<ngt-mesh castShadow receiveShadow>
				<ngt-box-geometry *args="[5.5, 0.45, 2.6]" />
				<ngt-mesh-standard-material color="#7c3aed" roughness="0.38" metalness="0.18" />
			</ngt-mesh>
			<ngt-mesh [position]="[0, 0.28, 0]" [scale]="[2.2, 1, 0.7]">
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="#c4b5fd" />
			</ngt-mesh>
		</ngt-object3D>

		@for (pillar of pillars; track pillar.position) {
			<ngt-object3D rigidBody="fixed" [position]="pillar.position" [options]="{ colliders: 'cuboid' }">
				<ngt-mesh castShadow receiveShadow [scale]="pillar.scale">
					<ngt-box-geometry />
					<ngt-mesh-standard-material [color]="pillar.color" roughness="0.65" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<app-ecctrl-keyboard-player [position]="[0, 1.2, 0]" [options]="playerOptions" />
	`,
	imports: [EcctrlKeyboardPlayer, NgtArgs, NgtrCuboidCollider, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlMovingPlatformScene {
	protected readonly playerOptions: NgteEcctrlOptions = {
		enableToggleRun: false,
		followPlatform: true,
		maxRunVel: 6,
	};
	protected readonly pillars = [
		{
			position: [-6, -0.75, -4] as [number, number, number],
			scale: [1.2, 4.5, 1.2] as [number, number, number],
			color: '#1d4ed8',
		},
		{
			position: [6, -0.5, 5] as [number, number, number],
			scale: [1.5, 5, 1.5] as [number, number, number],
			color: '#0891b2',
		},
		{
			position: [12, -0.8, -4] as [number, number, number],
			scale: [1, 4.2, 1] as [number, number, number],
			color: '#4f46e5',
		},
		{
			position: [10, -0.4, 5] as [number, number, number],
			scale: [1.2, 5.2, 1.2] as [number, number, number],
			color: '#7c3aed',
		},
	];

	private readonly turntable = viewChild.required('turntable', { read: NgtrRigidBody });
	private readonly shuttle = viewChild.required('shuttle', { read: NgtrRigidBody });
	private readonly turntableRotation = new THREE.Quaternion();
	private readonly shuttleRotation = new THREE.Quaternion();

	constructor() {
		beforeRender(() => {
			const time = performance.now() / 1000;
			const turntable = this.turntable().rigidBody();
			if (turntable) {
				turntable.setNextKinematicTranslation({
					x: Math.sin(time * 0.55) * 1.2,
					y: Math.sin(time * 1.1) * 0.35,
					z: Math.cos(time * 0.55) * 1.2,
				});
				turntable.setNextKinematicRotation(
					this.turntableRotation.setFromEuler(new THREE.Euler(0, time * 0.7, 0)),
				);
			}

			const shuttle = this.shuttle().rigidBody();
			if (shuttle) {
				shuttle.setNextKinematicTranslation({ x: 7, y: 1.8, z: Math.sin(time * 0.75) * 6 });
				shuttle.setNextKinematicRotation(
					this.shuttleRotation.setFromEuler(new THREE.Euler(0, -time * 0.45, 0)),
				);
			}
		});
	}
}

@Component({
	selector: 'app-ecctrl-moving-platform',
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
						[shadow.camera.left]="-18"
						[shadow.camera.right]="18"
						[shadow.camera.top]="18"
						[shadow.camera.bottom]="-18"
						[shadow.bias]="-0.0001"
						[shadow.normalBias]="0.02"
						[shadow.radius]="4"
						[shadow.intensity]="0.65"
					/>

					<app-ecctrl-moving-platform-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlExampleOverlay, EcctrlMovingPlatformScene, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlMovingPlatform {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
