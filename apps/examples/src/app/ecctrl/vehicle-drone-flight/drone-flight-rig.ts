import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { beforeRender, injectStore, NgtArgs, NgtPortal, NgtPortalAutoRender } from 'angular-three';
import {
	NgteEcctrlVehicle,
	NgteThrustPropeller,
	type NgteEcctrlVehicleOptions,
	type NgteThrustPropellerOptions,
} from 'angular-three-ecctrl/vehicle';
import { NgtrCuboidCollider, NgtrCylinderCollider } from 'angular-three-rapier';
import { NgtsOrthographicCamera, NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { createKeyboardControls, NgtsKeyboardControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { fbo } from 'angular-three-soba/misc';
import {
	DirectionalLight,
	Euler,
	FrontSide,
	MathUtils,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	Quaternion,
	Scene,
	Vector3,
} from 'three';
import type { GLTF } from 'three-stdlib';
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

const CHASE_DISTANCE = 11;
const CHASE_HEIGHT = 3.8;
const REVERSAL_ASSIST_ACCELERATION = 18;
const SUN_OFFSET = new Vector3(45, 70, 35);
const WORLD_UP = new Vector3(0, 1, 0);

@Component({
	selector: 'app-ecctrl-drone-flight-rig',
	template: `
		<ngt-group [keyboardControls]="controlsMap" preventDefault>
			<ngte-ecctrl-vehicle
				[position]="[0, 7, 36]"
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

				@if (gltf.value(); as vehicleModel) {
					<ngt-group [dispose]="null">
						<ngt-mesh
							castShadow
							receiveShadow
							[geometry]="vehicleModel.nodes.VehicleBody3.geometry"
							[material]="vehicleModel.materials.GridTexture"
						/>

						@for (propeller of propellers; track propeller.id) {
							<ngte-thrust-propeller
								[id]="propeller.id"
								[position]="propeller.position"
								[options]="propeller.options"
							>
								<ngt-mesh
									castShadow
									[geometry]="vehicleModel.nodes.R065Propeller.geometry"
									[material]="vehicleModel.materials.GridTexture"
								/>
							</ngte-thrust-propeller>
						}
					</ngt-group>
				}

				<ngts-perspective-camera
					#fpvCamera
					[options]="{
						manual: true,
						aspect: 16 / 9,
						fov: 68,
						near: 0.12,
						far: 260,
						position: [0, 0.15, 1.7],
						rotation: [0, Math.PI, 0],
					}"
				/>
			</ngte-ecctrl-vehicle>

			<ngts-perspective-camera
				#chaseCamera
				[options]="{ makeDefault: true, fov: 62, near: 0.1, far: 280, position: [0, 10, 47] }"
			/>

			<ngt-object3D #sunTarget />
			<ngt-directional-light
				#sun
				castShadow
				color="#ffd2a6"
				[position]="[45, 82, 71]"
				[intensity]="1.35 * Math.PI"
				[shadow.mapSize.width]="2048"
				[shadow.mapSize.height]="2048"
				[shadow.camera.near]="1"
				[shadow.camera.far]="180"
				[shadow.camera.left]="-52"
				[shadow.camera.right]="52"
				[shadow.camera.top]="52"
				[shadow.camera.bottom]="-52"
				[shadow.bias]="-0.0001"
				[shadow.normalBias]="0.035"
				[shadow.radius]="2.5"
				[shadow.intensity]="0.7"
			/>

			<ngt-portal [container]="hudScene" autoRender>
				<ng-template portalContent>
					<ngts-orthographic-camera
						[options]="{ makeDefault: true, near: 0.1, far: 20, position: [0, 0, 10] }"
					/>
					<ngt-group [position]="hudPosition()">
						<ngt-mesh [position]="[0, 0, -0.02]" [renderOrder]="1">
							<ngt-plane-geometry *args="hudFrameSize()" />
							<ngt-mesh-basic-material color="#020617" [depthTest]="false" [depthWrite]="false" />
						</ngt-mesh>
						<ngt-mesh [renderOrder]="2">
							<ngt-plane-geometry *args="hudSize()" />
							<ngt-mesh-basic-material
								[map]="fpvTarget.texture"
								[depthTest]="false"
								[depthWrite]="false"
							/>
						</ngt-mesh>
					</ngt-group>
				</ng-template>
			</ngt-portal>
		</ngt-group>
	`,
	imports: [
		NgtArgs,
		NgtPortal,
		NgtPortalAutoRender,
		NgteEcctrlVehicle,
		NgteThrustPropeller,
		NgtrCuboidCollider,
		NgtrCylinderCollider,
		NgtsKeyboardControls,
		NgtsOrthographicCamera,
		NgtsPerspectiveCamera,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DroneFlightRig {
	protected readonly Math = Math;
	protected readonly controlsMap = controlsMap;
	protected readonly gltf = gltfResource<VehicleGLTF>(() => '/vehicles.glb');
	protected readonly vehicleOptions: NgteEcctrlVehicleOptions = {
		droneConfig: {
			controlMode: 'VELOCITY',
			maxHorizSpeed: 38,
			maxVertSpeed: 10,
			maxTiltAngle: Math.PI / 6,
		},
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
	protected readonly hudScene = (() => {
		const scene = new Scene();
		scene.name = 'ecctrl-drone-flight-hud';
		return scene;
	})();
	protected readonly fpvTarget = fbo(() => ({
		width: 640,
		height: 360,
		settings: { samples: 2, depthBuffer: true, stencilBuffer: false, generateMipmaps: false },
	}));

	private readonly store = injectStore();
	private readonly exampleControls = inject(EcctrlExampleControls);
	private readonly vehicle = viewChild.required(NgteEcctrlVehicle);
	private readonly keyboard = viewChild.required(NgtsKeyboardControls);
	private readonly chaseCamera = viewChild.required<NgtsPerspectiveCamera>('chaseCamera');
	private readonly fpvCamera = viewChild.required<NgtsPerspectiveCamera>('fpvCamera');
	private readonly sun = viewChild.required<ElementRef<DirectionalLight>>('sun');
	private readonly sunTarget = viewChild.required<ElementRef<Object3D>>('sunTarget');

	private readonly dronePosition = new Vector3();
	private readonly droneQuaternion = new Quaternion();
	private readonly desiredCameraPosition = new Vector3();
	private readonly desiredCameraQuaternion = new Quaternion();
	private readonly forward = new Vector3();
	private readonly reversalImpulse = new Vector3();
	private readonly bodyEuler = new Euler(0, 0, 0, 'YXZ');
	private readonly chaseEuler = new Euler(0, 0, 0, 'YXZ');
	private chaseInitialized = false;
	private telemetryElapsed = 0;

	protected readonly hudLayout = computed(() => {
		const [canvasWidth, canvasHeight] = [this.store.size.width(), this.store.size.height()];
		const availableWidth = Math.max(160, canvasWidth - 36);
		const compactLandscape = canvasWidth < 900 && canvasHeight < 520;
		const width = compactLandscape
			? Math.min(220, Math.max(190, canvasWidth * 0.34), availableWidth)
			: Math.min(520, Math.max(240, canvasWidth * 0.38), availableWidth);
		const height = width * (9 / 16);
		const preferredTop = compactLandscape ? 16 : canvasWidth < 900 ? 112 : 20;
		const top = Math.min(preferredTop, Math.max(16, canvasHeight - height - 92));
		return { width, height, top, right: compactLandscape ? 16 : 20 };
	});
	protected readonly hudSize = computed<[number, number]>(() => {
		const { width, height } = this.hudLayout();
		return [width, height];
	});
	protected readonly hudFrameSize = computed<[number, number]>(() => {
		const { width, height } = this.hudLayout();
		return [width + 10, height + 10];
	});
	protected readonly hudPosition = computed<[number, number, number]>(() => {
		const { width, height, top, right } = this.hudLayout();
		return [this.store.size.width() / 2 - right - width / 2, this.store.size.height() / 2 - top - height / 2, 0];
	});

	constructor() {
		effect(() => {
			this.exampleControls.flightHudLayout.set(this.hudLayout());
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
			vehicle.setMovement({
				throttleUp: keyboard.select('throttleUp')(),
				throttleDown: keyboard.select('throttleDown')(),
				yawLeft: keyboard.select('yawLeft')(),
				yawRight: keyboard.select('yawRight')(),
				pitchForward: keyboard.select('pitchForward')(),
				pitchBackward: keyboard.select('pitchBackward')(),
				rollLeft: keyboard.select('rollLeft')(),
				rollRight: keyboard.select('rollRight')(),
				joystickL: this.exampleControls.flightJoystickLeft(),
				joystickR: this.exampleControls.flightJoystickRight(),
			});
		});

		effect(() => {
			const [sun, target] = [this.sun().nativeElement, this.sunTarget().nativeElement];
			sun.target = target;
			sun.shadow.autoUpdate = false;
			sun.shadow.needsUpdate = true;
		});

		beforeRender(({ delta, gl, scene }) => {
			this.updateFlight(delta);
			const camera = this.fpvCamera().cameraRef().nativeElement;

			const oldAutoClear = gl.autoClear;
			const oldXrEnabled = gl.xr.enabled;
			const oldIsPresenting = gl.xr.isPresenting;
			const oldRenderTarget = gl.getRenderTarget();
			try {
				gl.autoClear = true;
				gl.xr.enabled = false;
				gl.xr.isPresenting = false;
				gl.setRenderTarget(this.fpvTarget);
				gl.render(scene, camera);
			} finally {
				gl.setRenderTarget(oldRenderTarget);
				gl.autoClear = oldAutoClear;
				gl.xr.enabled = oldXrEnabled;
				gl.xr.isPresenting = oldIsPresenting;
			}
		});

		inject(DestroyRef).onDestroy(() => this.exampleControls.resetFlightHud());
	}

	private updateFlight(delta: number) {
		const vehicle = this.vehicle();
		const chaseCamera = this.chaseCamera().cameraRef().nativeElement;
		if (!vehicle.handle.body) return;
		const frameDelta = Math.min(delta, 0.1);

		const drone = vehicle.objectRef.nativeElement;
		drone.getWorldPosition(this.dronePosition);
		drone.getWorldQuaternion(this.droneQuaternion);

		this.forward.set(0, 0, 1).applyQuaternion(this.droneQuaternion).setY(0);
		if (this.forward.lengthSq() > 0.0001) this.forward.normalize();
		this.applyLongitudinalReversalAssist(vehicle, frameDelta);
		this.bodyEuler.setFromQuaternion(this.droneQuaternion, 'YXZ');
		const headingYaw = Math.atan2(this.forward.x, this.forward.z);
		this.desiredCameraPosition
			.copy(this.dronePosition)
			.addScaledVector(this.forward, -CHASE_DISTANCE)
			.addScaledVector(WORLD_UP, CHASE_HEIGHT);
		this.desiredCameraQuaternion.setFromEuler(
			this.chaseEuler.set(this.bodyEuler.x * 0.22 - 0.12, headingYaw + Math.PI, this.bodyEuler.z * 0.15, 'YXZ'),
		);

		if (!this.chaseInitialized || chaseCamera.position.distanceToSquared(this.desiredCameraPosition) > 400) {
			chaseCamera.position.copy(this.desiredCameraPosition);
			chaseCamera.quaternion.copy(this.desiredCameraQuaternion);
			this.chaseInitialized = true;
		} else {
			chaseCamera.position.lerp(this.desiredCameraPosition, 1 - Math.exp(-6 * frameDelta));
			chaseCamera.quaternion.slerp(this.desiredCameraQuaternion, 1 - Math.exp(-5 * frameDelta));
		}

		const speed = vehicle.handle.currLinVel.length();
		const fov = MathUtils.clamp(62 + speed * 0.2, 62, 70);
		const nextFov = MathUtils.damp(chaseCamera.fov, fov, 4, frameDelta);
		if (Math.abs(nextFov - chaseCamera.fov) > 0.001) {
			chaseCamera.fov = nextFov;
			chaseCamera.updateProjectionMatrix();
		}

		const target = this.sunTarget().nativeElement;
		const sun = this.sun().nativeElement;
		target.position.set(this.dronePosition.x + this.forward.x * 9, 12, this.dronePosition.z + this.forward.z * 9);
		sun.position.copy(target.position).add(SUN_OFFSET);
		sun.shadow.needsUpdate = true;

		this.telemetryElapsed += frameDelta;
		if (this.telemetryElapsed < 0.08) return;
		this.telemetryElapsed = 0;
		const heading = (MathUtils.radToDeg(Math.atan2(this.forward.x, -this.forward.z)) + 360) % 360;
		this.exampleControls.flightTelemetry.set({
			altitude: Math.max(0, this.dronePosition.y),
			heading: Math.round(heading),
			pitch: MathUtils.radToDeg(this.bodyEuler.x),
			roll: MathUtils.radToDeg(this.bodyEuler.z),
			speed,
			verticalSpeed: vehicle.handle.currLinVel.y,
		});
	}

	private applyLongitudinalReversalAssist(vehicle: NgteEcctrlVehicle, delta: number) {
		const body = vehicle.handle.body;
		if (!body) return;
		// Velocity mode derives horizontal braking from tilt. Supplement only an
		// opposing command so direction changes are responsive without exceeding the 30° tilt cap.
		const input = vehicle.handle.input;
		const pitch = MathUtils.clamp(
			Number(!!input.pitchForward) - Number(!!input.pitchBackward) + (input.joystickR?.y ?? 0),
			-1,
			1,
		);
		const forwardSpeed = vehicle.handle.currLinVel.dot(this.forward);
		if (Math.abs(pitch) < 0.05 || forwardSpeed * pitch >= 0) return;

		const deltaVelocity = Math.min(Math.abs(forwardSpeed), REVERSAL_ASSIST_ACCELERATION * Math.abs(pitch) * delta);
		this.reversalImpulse.copy(this.forward).multiplyScalar(-Math.sign(forwardSpeed) * deltaVelocity * body.mass());
		body.applyImpulse(this.reversalImpulse, true);
	}
}
