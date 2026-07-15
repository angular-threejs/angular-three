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
	NgteShapeCastWheel,
	type NgteEcctrlVehicleOptions,
	type NgteShapeCastWheelOptions,
} from 'angular-three-ecctrl/vehicle';
import { NgtrCuboidCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { createKeyboardControls, NgtsCameraControls, NgtsKeyboardControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtCanvas } from 'angular-three/dom';
import { FrontSide, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { GLTF } from 'three-stdlib';
import { createCameraTargetFollowRuntime, followCameraControlsTarget } from '../shared/camera-target-follow';
import { EcctrlExampleControls } from '../shared/example-controls';
import { EcctrlExampleOverlay } from '../shared/example-overlay';

type VehicleGLTF = GLTF & {
	nodes: {
		R05Wheel: Mesh;
		VehicleBody1: Mesh;
	};
	materials: { GridTexture: MeshStandardMaterial };
};

const { controlsMap } = createKeyboardControls([
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'backward', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'steerLeft', keys: ['ArrowLeft', 'KeyA'] },
	{ name: 'steerRight', keys: ['ArrowRight', 'KeyD'] },
	{ name: 'brake', keys: ['Space'] },
]);

const WHEEL_OPTIONS: NgteShapeCastWheelOptions = {
	debug: false,
	rayShapeR: 0.5,
	rayShapeH: 0.15,
	rayLength: 0.5,
	springK: 38_000,
	dampingC: 4_000,
	maxBrakeTorque: 3_000,
	tireGripFactor: 1.3,
	wheelModelDensity: 100,
	wheelModelRadius: 0.5,
};

@Component({
	selector: 'app-ecctrl-car-rig',
	template: `
		<ngt-group [keyboardControls]="controlsMap" preventDefault>
			<ngte-ecctrl-vehicle
				[position]="[0, 2, 5]"
				[options]="vehicleOptions"
				[rigidBodyOptions]="{ canSleep: false }"
			>
				<ngt-object3D
					[cuboidCollider]="[1, 0.4, 2.4]"
					[position]="[0, 0.1, 0]"
					[options]="{ density: 200, friction: 0.8 }"
				/>

				@if (gltf.value(); as vehicle) {
					<ngt-group [dispose]="null">
						<ngt-mesh
							castShadow
							receiveShadow
							[geometry]="vehicle.nodes.VehicleBody1.geometry"
							[material]="vehicle.materials.GridTexture"
							[position]="[0, 0.1, 0]"
						/>

						@for (wheel of wheels; track wheel.id) {
							<ngte-shape-cast-wheel
								[id]="wheel.id"
								[position]="wheel.position"
								[options]="wheel.options"
							>
								<ngt-mesh
									castShadow
									[geometry]="vehicle.nodes.R05Wheel.geometry"
									[material]="vehicle.materials.GridTexture"
									[rotation]="[0, 0, Math.PI / 2]"
								/>
							</ngte-shape-cast-wheel>
						}
					</ngt-group>
				}
			</ngte-ecctrl-vehicle>

			<ngts-camera-controls
				[options]="{
					makeDefault: true,
					maxPolarAngle: Math.PI / 2.02,
					minDistance: 5,
					maxDistance: 22,
					smoothTime: 0.12,
				}"
			/>
		</ngt-group>
	`,
	imports: [NgteEcctrlVehicle, NgteShapeCastWheel, NgtrCuboidCollider, NgtsCameraControls, NgtsKeyboardControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlCarRig {
	protected readonly Math = Math;
	protected readonly controlsMap = controlsMap;
	protected readonly gltf = gltfResource<VehicleGLTF>(() => '/vehicles.glb');
	protected readonly vehicleOptions: NgteEcctrlVehicleOptions = {
		carConfig: {
			engineHorsepower: 600,
			engineMaxRPM: 6_000,
			finalDriveRatio: 1,
			reverseRPMScale: 0.5,
		},
	};
	protected readonly wheels = [
		{
			id: 'front-left',
			position: [0.9, 0, 1.8] as [number, number, number],
			options: { ...WHEEL_OPTIONS, steerWheel: true, brakeWheel: true, driveWheel: true },
		},
		{
			id: 'front-right',
			position: [-0.9, 0, 1.8] as [number, number, number],
			options: { ...WHEEL_OPTIONS, steerWheel: true, brakeWheel: true, driveWheel: true },
		},
		{
			id: 'rear-left',
			position: [0.9, 0, -1.8] as [number, number, number],
			options: { ...WHEEL_OPTIONS, brakeWheel: true, driveWheel: true },
		},
		{
			id: 'rear-right',
			position: [-0.9, 0, -1.8] as [number, number, number],
			options: { ...WHEEL_OPTIONS, brakeWheel: true, driveWheel: true },
		},
	];

	private readonly vehicle = viewChild(NgteEcctrlVehicle);
	private readonly keyboard = viewChild(NgtsKeyboardControls);
	private readonly cameraControls = viewChild(NgtsCameraControls);
	private readonly cameraAnchor = new Vector3();
	private readonly cameraFollow = createCameraTargetFollowRuntime();

	constructor() {
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
				forward: keyboard.select('forward')(),
				backward: keyboard.select('backward')(),
				steerLeft: keyboard.select('steerLeft')(),
				steerRight: keyboard.select('steerRight')(),
				brake: keyboard.select('brake')(),
			});
		});

		beforeRender(() => {
			const vehicle = this.vehicle();
			const controls = this.cameraControls()?.controls();
			if (!vehicle?.handle.body || !controls) return;
			const target = vehicle.handle.body.translation();
			this.cameraAnchor.set(target.x, target.y + 0.6, target.z);
			followCameraControlsTarget(controls, this.cameraAnchor, this.cameraFollow);
		});
	}
}

@Component({
	selector: 'app-ecctrl-vehicle-car-scene',
	template: `
		<ngt-color attach="background" *args="['#0f172a']" />

		<ngt-object3D rigidBody="fixed" [position]="[0, -0.5, 0]" [options]="{ colliders: 'cuboid' }">
			<ngt-mesh receiveShadow [scale]="[34, 1, 34]">
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="#1e293b" roughness="0.94" />
			</ngt-mesh>
		</ngt-object3D>

		@for (obstacle of obstacles; track obstacle.position) {
			<ngt-object3D
				rigidBody="fixed"
				[position]="obstacle.position"
				[rotation]="obstacle.rotation"
				[options]="{ colliders: 'cuboid' }"
			>
				<ngt-mesh castShadow receiveShadow [scale]="obstacle.scale">
					<ngt-box-geometry />
					<ngt-mesh-standard-material [color]="obstacle.color" roughness="0.68" />
				</ngt-mesh>
			</ngt-object3D>
		}

		<app-ecctrl-car-rig />
	`,
	imports: [EcctrlCarRig, NgtArgs, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class EcctrlVehicleCarScene {
	protected readonly obstacles = [
		{
			position: [0, 0.45, -5] as [number, number, number],
			rotation: [0.18, 0, 0] as [number, number, number],
			scale: [5, 0.45, 5] as [number, number, number],
			color: '#0f766e',
		},
		{
			position: [-7, 0.6, -10] as [number, number, number],
			rotation: [0, 0, 0] as [number, number, number],
			scale: [2.5, 1.2, 2.5] as [number, number, number],
			color: '#334155',
		},
		{
			position: [8, 0.35, -12] as [number, number, number],
			rotation: [0, -0.45, 0.16] as [number, number, number],
			scale: [6, 0.5, 2.5] as [number, number, number],
			color: '#7c2d12',
		},
	];

	constructor() {
		const controls = inject(EcctrlExampleControls);
		const resetInstructions = controls.setInstructions(
			'Car · W/S accelerate · A/D steer · Space brake · drag to orbit · wheel to zoom',
		);
		inject(DestroyRef).onDestroy(resetInstructions);
	}
}

@Component({
	selector: 'app-ecctrl-vehicle-car',
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
						[shadow.camera.far]="50"
						[shadow.camera.left]="-22"
						[shadow.camera.right]="22"
						[shadow.camera.top]="22"
						[shadow.camera.bottom]="-22"
						[shadow.bias]="-0.0001"
						[shadow.normalBias]="0.02"
						[shadow.radius]="4"
						[shadow.intensity]="0.65"
					/>

					<app-ecctrl-vehicle-car-scene />
				</ng-template>
			</ngtr-physics>
		</ngt-canvas>
		<app-ecctrl-example-overlay />
	`,
	imports: [EcctrlExampleOverlay, EcctrlVehicleCarScene, NgtCanvas, NgtrPhysics],
	providers: [EcctrlExampleControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'block h-full relative w-full' },
})
export default class EcctrlVehicleCar {
	protected readonly Math = Math;
	protected readonly controls = inject(EcctrlExampleControls);
}
