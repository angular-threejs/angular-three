import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import type { World } from '@dimforge/rapier3d-compat';
import { NgtrMeshCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtTestBed } from 'angular-three/testing';
import * as THREE from 'three';
import { vi } from 'vitest';
import { NgteEcctrlVehicle } from './ecctrl-vehicle';
import type {
	NgtePropellerInfo,
	NgteWheelControlConfig,
	NgteWheelControlDemand,
	NgteWheelInfo,
} from './vehicle-context';

@Directive({ selector: 'ngt-object3D[captureVehicleBody]' })
class CaptureVehicleBody {
	readonly body = inject(NgtrRigidBody);
}

@Component({
	template: `
		<ngte-ecctrl-vehicle>
			<ngt-object3D captureVehicleBody />
		</ngte-ecctrl-vehicle>
	`,
	imports: [CaptureVehicleBody, NgteEcctrlVehicle],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class VehicleProjectionHarness {
	readonly vehicle = viewChild.required(NgteEcctrlVehicle);
	readonly capture = viewChild.required(CaptureVehicleBody);
}

@Component({
	template: `
		<ngte-ecctrl-vehicle [rigidBodyOptions]="{ colliders: false, friction: 0.73, restitution: 0.4 }">
			<ngt-object3D [meshCollider]="'cuboid'">
				<ngt-mesh>
					<ngt-box-geometry />
				</ngt-mesh>
			</ngt-object3D>
		</ngte-ecctrl-vehicle>
	`,
	imports: [NgteEcctrlVehicle, NgtrMeshCollider],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class VehicleMeshColliderHarness {
	readonly meshCollider = viewChild.required(NgtrMeshCollider);
}

type PhysicsStep = (world: World, delta?: number) => void;

function createPhysicsStub() {
	return {
		worldSingleton: signal(null),
		colliders: signal(false),
		rigidBodyStates: new Map(),
		colliderStates: new Map(),
		rigidBodyEvents: new Map(),
		colliderEvents: new Map(),
		beforeStepCallbacks: new Set<PhysicsStep>(),
		afterStepCallbacks: new Set<PhysicsStep>(),
		filterContactPairCallbacks: new Set(),
		filterIntersectionPairCallbacks: new Set(),
		rapier: signal(null),
	};
}

function createBody() {
	return {
		handle: 1,
		userData: {},
		translation: vi.fn(() => ({ x: 0, y: 1, z: 0 })),
		linvel: vi.fn(() => ({ x: 2, y: 0, z: 0 })),
		angvel: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
		rotation: vi.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
		mass: vi.fn(() => 1),
		gravityScale: vi.fn(() => 1),
		isSleeping: vi.fn(() => false),
		isKinematic: vi.fn(() => false),
		setEnabled: vi.fn(),
		wakeUp: vi.fn(),
		applyImpulse: vi.fn(),
		applyImpulseAtPoint: vi.fn(),
	};
}

function createWheel(
	id: string,
	weight = 1,
): NgteWheelInfo & {
	configured: NgteWheelControlConfig | null;
	demand: NgteWheelControlDemand | null;
	step: ReturnType<typeof vi.fn>;
} {
	const wheel = {
		id,
		driveWheel: true,
		steerWheel: true,
		brakeWheel: true,
		driveTorqueWeight: weight,
		wheelRadius: 0.5,
		maxBrakeTorque: 40,
		driveInvert: false,
		steerInvert: false,
		wheelAngVel: 0,
		wheelLinVel: 0,
		steerAngle: 0,
		hasContact: true,
		isOnPlatform: false,
		contactBody: null,
		suspensionImpulse: new THREE.Vector3(0, 1, 0),
		longitudinalImpulse: new THREE.Vector3(2, 0, 0),
		lateralImpulse: new THREE.Vector3(0, 0, 3),
		suspensionPoint: new THREE.Vector3(1, 2, 3),
		contactPoint: new THREE.Vector3(4, 5, 6),
		configured: null as NgteWheelControlConfig | null,
		demand: null as NgteWheelControlDemand | null,
		configure(config: NgteWheelControlConfig) {
			wheel.configured = config;
		},
		setDemand(demand: NgteWheelControlDemand) {
			wheel.demand = demand;
		},
		step: vi.fn(),
	};
	return wheel as unknown as NgteWheelInfo & {
		configured: NgteWheelControlConfig | null;
		demand: NgteWheelControlDemand | null;
		step: ReturnType<typeof vi.fn>;
	};
}

function createPropeller(
	id: string,
	ax: number,
	az: number,
): NgtePropellerInfo & {
	apply: ReturnType<typeof vi.fn>;
} {
	const propeller = {
		id,
		maxThrust: 100,
		torqueRatio: 0.6,
		invertThrust: false,
		invertTorque: false,
		currentThrottle: 0,
		worldPosition: new THREE.Vector3(),
		worldQuaternion: new THREE.Quaternion(),
		lx: 0,
		ly: 100,
		lz: 0,
		ax,
		ay: 0,
		az,
		prepare: vi.fn(),
		setThrottle(throttle: number) {
			propeller.currentThrottle = throttle;
		},
		apply: vi.fn(),
	};
	return propeller as unknown as NgtePropellerInfo & { apply: ReturnType<typeof vi.fn> };
}

function mountVehicle() {
	const physics = createPhysicsStub();
	const { fixture, sceneGraphComponentRef } = NgtTestBed.create(NgteEcctrlVehicle, {
		providers: [{ provide: NgtrPhysics, useValue: physics }],
	});
	const vehicle = sceneGraphComponentRef.instance;
	const body = createBody();
	(vehicle as unknown as { body: unknown }).body = signal(body);
	const step = [...physics.beforeStepCallbacks][0];
	if (!step) throw new Error('NgteEcctrlVehicle did not register a physics callback.');
	const world = { timestep: 0.1, gravity: { x: 0, y: -9.81, z: 0 } } as World;
	return { body, fixture, sceneGraphComponentRef, step: () => step(world, world.timestep), vehicle, world };
}

describe(NgteEcctrlVehicle.name, () => {
	it('provides its owned body through a rigid-body-compatible projection adapter', () => {
		const physics = createPhysicsStub();
		const { sceneGraphComponentRef } = NgtTestBed.create(VehicleProjectionHarness, {
			providers: [{ provide: NgtrPhysics, useValue: physics }],
		});
		const harness = sceneGraphComponentRef.instance;

		expect(harness.capture().body.rigidBody).toBe(harness.vehicle().rigidBody);
		expect(harness.capture().body.options()).toMatchObject({ colliders: false, gravityScale: 1 });
	});

	it('provides projected mesh colliders with rigid-body collider options', async () => {
		const physics = createPhysicsStub();
		const { advance, sceneGraphComponentRef } = NgtTestBed.create(VehicleMeshColliderHarness, {
			providers: [{ provide: NgtrPhysics, useValue: physics }],
		});
		await advance();

		const meshCollider = sceneGraphComponentRef.instance.meshCollider();
		const childColliderOptions = (
			meshCollider as unknown as {
				childColliderOptions: () => Array<{ colliderOptions: { friction?: number; restitution?: number } }>;
			}
		).childColliderOptions();

		expect(childColliderOptions).toHaveLength(1);
		expect(childColliderOptions[0].colliderOptions).toMatchObject({ friction: 0.73, restitution: 0.4 });
	});

	it('merges defined input fields and copies joystick values', () => {
		const { vehicle } = mountVehicle();
		const joystick = { x: 0.25, y: -0.5 };

		vehicle.setMovement({ forward: true, joystickL: joystick });
		vehicle.setMovement({ forward: undefined, brake: true });
		joystick.x = 1;

		expect(vehicle.handle.input.forward).toBe(true);
		expect(vehicle.handle.input.brake).toBe(true);
		expect(vehicle.handle.input.joystickL).toEqual({ x: 0.25, y: -0.5 });
	});

	it('rebalances engine torque across weighted drive wheels', () => {
		const { vehicle } = mountVehicle();
		const front = createWheel('front', 3);
		const rear = createWheel('rear', 1);

		vehicle.registerWheel(front);
		vehicle.registerWheel(rear);

		const maximumTorque = (6 * 7022) / 6000;
		expect(front.configured?.maxDriveTorque).toBeCloseTo(maximumTorque * 0.75);
		expect(rear.configured?.maxDriveTorque).toBeCloseTo(maximumTorque * 0.25);
		expect(front.configured?.driveRatio).toBe(10);
	});

	it('calculates wheel modules before applying suspension and tire impulses at their distinct points', () => {
		const { body, step, vehicle } = mountVehicle();
		const wheel = createWheel('front-left');
		vehicle.registerWheel(wheel);
		vehicle.setMovement({ forward: true, steerLeft: true, brake: true });

		step();

		expect(wheel.step).toHaveBeenCalledOnce();
		expect(wheel.demand).toEqual({ drive: 1, steer: 1, brake: 1 });
		expect(body.applyImpulseAtPoint.mock.calls).toEqual([
			[{ x: 0, y: 1, z: 0 }, { x: 1, y: 2, z: 3 }, false],
			[{ x: 2, y: 0, z: 0 }, { x: 4, y: 5, z: 6 }, false],
			[{ x: 0, y: 0, z: 3 }, { x: 4, y: 5, z: 6 }, false],
		]);
	});

	it('mixes symmetric propellers and applies drag without a mass multiplier', () => {
		const { body, step, vehicle } = mountVehicle();
		const propellers = [
			createPropeller('fl', 1, 1),
			createPropeller('fr', -1, 1),
			createPropeller('rl', 1, -1),
			createPropeller('rr', -1, -1),
		];
		for (const propeller of propellers) vehicle.registerPropeller(propeller);

		step();

		for (const propeller of propellers) {
			expect(propeller.apply).toHaveBeenCalledWith(0.1);
		}
		expect(propellers[0].currentThrottle).toBeCloseTo(propellers[1].currentThrottle);
		expect(propellers[2].currentThrottle).toBeCloseTo(propellers[3].currentThrottle);
		expect(
			propellers.reduce((sum, propeller) => sum + propeller.currentThrottle, 0) / propellers.length,
		).toBeCloseTo(9.81 / 400);
		const [drag, wakeUp] = body.applyImpulse.mock.calls.at(-1)!;
		expect(drag.x).toBeCloseTo(-0.04);
		expect(drag.y).toBeCloseTo(0);
		expect(drag.z).toBeCloseTo(0);
		expect(wakeUp).toBe(false);
	});
});
