import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	inject,
	viewChild,
} from '@angular/core';
import { beforeRender, NgtArgs } from 'angular-three';
import {
	NgteEcctrlVehicle,
	NgteThrustPropeller,
	type NgteEcctrlVehicleOptions,
	type NgteThrustPropellerOptions,
} from 'angular-three-ecctrl/vehicle';
import { NgtrCuboidCollider, NgtrCylinderCollider, NgtrRigidBody } from 'angular-three-rapier';
import { createKeyboardControls, NgtsCameraControls, NgtsKeyboardControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { FrontSide, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { GLTF } from 'three-stdlib';
import { createCameraTargetFollowRuntime, followCameraControlsTarget } from '../shared/camera-target-follow';
import { EcctrlExampleControls } from '../shared/example-controls';

type VehicleGLTF = GLTF & {
	nodes: {
		R065Propeller: Mesh;
		VehicleBody3: Mesh;
	};
	materials: { GridTexture: MeshStandardMaterial };
};

const { controlsMap } = createKeyboardControls([
	{ name: 'throttleUp', keys: ['KeyW'] },
	{ name: 'throttleDown', keys: ['KeyS'] },
	{ name: 'yawLeft', keys: ['KeyA'] },
	{ name: 'yawRight', keys: ['KeyD'] },
	{ name: 'pitchForward', keys: ['ArrowUp'] },
	{ name: 'pitchBackward', keys: ['ArrowDown'] },
	{ name: 'rollLeft', keys: ['ArrowLeft'] },
	{ name: 'rollRight', keys: ['ArrowRight'] },
]);

const PROPELLER_OPTIONS: NgteThrustPropellerOptions = {
	debug: false,
	maxThrust: 5_000,
	torqueRatio: 0.6,
	propellerModelMaxSpin: 50,
	propellerModelLerpSpinRate: 10,
};

@Component({
	selector: 'app-ecctrl-drone-rig',
	template: `
		<ngt-group [keyboardControls]="controlsMap" preventDefault>
			<ngte-ecctrl-vehicle
				[position]="[0, 4, 4]"
				[rotation]="[0, Math.PI, 0]"
				[options]="vehicleOptions"
				[rigidBodyOptions]="{ canSleep: false }"
			>
				<ngt-object3D [cuboidCollider]="[0.4, 0.2, 1.5]" [options]="{ density: 200 }" />
				@for (position of strutPositions; track position) {
					<ngt-object3D
						[cylinderCollider]="[0.05, 0.65]"
						[position]="position"
						[options]="{ density: 200 }"
					/>
				}

				@if (gltf.value(); as vehicle) {
					<ngt-group [dispose]="null">
						<ngt-mesh
							castShadow
							receiveShadow
							[geometry]="vehicle.nodes.VehicleBody3.geometry"
							[material]="vehicle.materials.GridTexture"
						/>

						@for (propeller of propellers; track propeller.id) {
							<ngte-thrust-propeller
								[id]="propeller.id"
								[position]="propeller.position"
								[options]="propeller.options"
							>
								<ngt-mesh
									castShadow
									[geometry]="vehicle.nodes.R065Propeller.geometry"
									[material]="vehicle.materials.GridTexture"
								/>
							</ngte-thrust-propeller>
						}
					</ngt-group>
				}
			</ngte-ecctrl-vehicle>

			<ngts-camera-controls
				[options]="{
					makeDefault: true,
					minDistance: 5,
					maxDistance: 24,
					smoothTime: 0.12,
				}"
			/>
		</ngt-group>
	`,
	imports: [
		NgteEcctrlVehicle,
		NgteThrustPropeller,
		NgtrCuboidCollider,
		NgtrCylinderCollider,
		NgtsCameraControls,
		NgtsKeyboardControls,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlDroneRig {
	protected readonly Math = Math;
	protected readonly controlsMap = controlsMap;
	protected readonly gltf = gltfResource<VehicleGLTF>(() => '/vehicles.glb');
	protected readonly vehicleOptions: NgteEcctrlVehicleOptions = {
		droneConfig: { controlMode: 'VELOCITY' },
	};
	protected readonly strutPositions: [number, number, number][] = [
		[1, -0.15, 1],
		[1, -0.15, -1],
		[-1, -0.15, 1],
		[-1, -0.15, -1],
	];
	protected readonly propellers = [
		{
			id: 'front-left',
			position: [1, -0.15, 1] as [number, number, number],
			options: { ...PROPELLER_OPTIONS, invertTorque: true },
		},
		{
			id: 'front-right',
			position: [-1, -0.15, 1] as [number, number, number],
			options: PROPELLER_OPTIONS,
		},
		{
			id: 'rear-left',
			position: [1, -0.15, -1] as [number, number, number],
			options: PROPELLER_OPTIONS,
		},
		{
			id: 'rear-right',
			position: [-1, -0.15, -1] as [number, number, number],
			options: { ...PROPELLER_OPTIONS, invertTorque: true },
		},
	];

	private readonly vehicle = viewChild(NgteEcctrlVehicle);
	private readonly keyboard = viewChild(NgtsKeyboardControls);
	private readonly cameraControls = viewChild(NgtsCameraControls);
	private readonly exampleControls = inject(EcctrlExampleControls);
	private readonly cameraAnchor = new Vector3();
	private readonly cameraFollow = createCameraTargetFollowRuntime();

	constructor() {
		effect((onCleanup) => {
			const controls = this.cameraControls()?.controls();
			if (!controls) return;
			this.exampleControls.restoreCameraTarget(controls);
			onCleanup(() => this.exampleControls.captureCameraTarget(controls));
		});

		effect(() => {
			const material = this.gltf.value()?.materials.GridTexture;
			if (material) {
				material.side = FrontSide;
				material.needsUpdate = true;
			}
		});

		effect(() => {
			const keyboard = this.keyboard();
			const vehicle = this.vehicle();
			if (!keyboard || !vehicle) return;
			vehicle.setMovement({
				throttleUp: keyboard.select('throttleUp')(),
				throttleDown: keyboard.select('throttleDown')(),
				yawLeft: keyboard.select('yawLeft')(),
				yawRight: keyboard.select('yawRight')(),
				pitchForward: keyboard.select('pitchForward')(),
				pitchBackward: keyboard.select('pitchBackward')(),
				rollLeft: keyboard.select('rollLeft')(),
				rollRight: keyboard.select('rollRight')(),
			});
		});

		beforeRender(() => {
			const vehicle = this.vehicle();
			const controls = this.cameraControls()?.controls();
			if (!vehicle?.handle.body || !controls) return;
			const target = vehicle.handle.body.translation();
			this.cameraAnchor.set(target.x, target.y + 0.4, target.z);
			followCameraControlsTarget(controls, this.cameraAnchor, this.cameraFollow);
		});
	}
}

@Component({
	selector: 'app-ecctrl-vehicle-drone-scene',
	template: `
		<ngt-color attach="background" *args="['#082f49']" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -0.5, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[40, 1, 40]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#164e63" roughness="0.92" />
			</ngt-mesh>
		</ngt-object3D>

		@for (beacon of beacons; track beacon.position) {
			<ngt-object3D rigidBody="fixed" [position]="beacon.position" [options]="{ colliders: 'cuboid' }">
				<ngt-mesh castShadow receiveShadow [scale]="beacon.scale">
					<ngt-box-geometry />
					<ngt-mesh-standard-material [color]="beacon.color" roughness="0.58" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<app-ecctrl-drone-rig />
	`,
	imports: [EcctrlDroneRig, NgtArgs, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EcctrlVehicleDroneScene {
	protected readonly beacons: Array<{
		position: [number, number, number];
		scale: [number, number, number];
		color: string;
	}> = [
		{ position: [-7, 2, -6], scale: [1, 4, 1], color: '#0891b2' },
		{ position: [8, 3.5, -10], scale: [1.5, 7, 1.5], color: '#0e7490' },
		{ position: [-10, 5, -15], scale: [2, 10, 2], color: '#155e75' },
	];

	constructor() {
		const controls = inject(EcctrlExampleControls);
		const resetInstructions = controls.setInstructions(
			'Drone · W/S climb/descend · A/D yaw · ↑/↓ pitch · ←/→ roll · drag to orbit · wheel to zoom',
		);
		inject(DestroyRef).onDestroy(resetInstructions);
	}
}
