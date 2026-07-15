import { signal } from '@angular/core';
import type { Collider, RigidBody, World } from '@dimforge/rapier3d-compat';
import { NgtrPhysics } from 'angular-three-rapier';
import { NgtTestBed } from 'angular-three/testing';
import * as THREE from 'three';
import { vi } from 'vitest';
import { NgteShapeCastWheel } from './shape-cast-wheel';
import {
	NGTE_ECCTRL_VEHICLE_CONTEXT,
	type NgteEcctrlVehicleContext,
	type NgteEcctrlVehicleRuntimeState,
	type NgteWheelInfo,
} from './vehicle-context';

class FakeCylinder {
	constructor(
		readonly halfHeight: number,
		readonly radius: number,
	) {}
}

function createPhysicsStub() {
	return {
		worldSingleton: signal(null),
		colliders: signal(false),
		rigidBodyStates: new Map(),
		colliderStates: new Map(),
		rigidBodyEvents: new Map(),
		colliderEvents: new Map(),
		beforeStepCallbacks: new Set(),
		afterStepCallbacks: new Set(),
		filterContactPairCallbacks: new Set(),
		filterIntersectionPairCallbacks: new Set(),
		rapier: signal({
			Cylinder: FakeCylinder,
			QueryFilterFlags: { EXCLUDE_SENSORS: 1 },
		}),
	};
}

function createBody(): RigidBody {
	return {
		handle: 1,
		userData: {},
		translation: vi.fn(() => ({ x: 0, y: 1, z: 0 })),
		linvel: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
		angvel: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
		rotation: vi.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
		mass: vi.fn(() => 10),
	} as unknown as RigidBody;
}

function createContext(body: RigidBody) {
	let wheel: NgteWheelInfo | null = null;
	const state: NgteEcctrlVehicleRuntimeState = {
		body,
		upAxis: new THREE.Vector3(0, 1, 0),
		gravityDir: new THREE.Vector3(0, -1, 0),
		gravityMag: 9.81,
		currPos: new THREE.Vector3(),
		currQuat: new THREE.Quaternion(),
		currLinVel: new THREE.Vector3(),
		currAngVel: new THREE.Vector3(),
		bodyXAxis: new THREE.Vector3(1, 0, 0),
		bodyYAxis: new THREE.Vector3(0, 1, 0),
		bodyZAxis: new THREE.Vector3(0, 0, 1),
		input: {},
	};
	const context: NgteEcctrlVehicleContext = {
		state,
		registerWheel(value) {
			wheel = value;
		},
		unregisterWheel() {
			wheel = null;
		},
		registerPropeller: vi.fn(),
		unregisterPropeller: vi.fn(),
	};
	return { context, registeredWheel: () => wheel };
}

function createCollider(userData: Record<string, unknown> = {}, friction = 0.8): Collider {
	const body = {
		userData,
		bodyType: vi.fn(() => 1),
	} as unknown as RigidBody;
	return {
		parent: vi.fn(() => body),
		friction: vi.fn(() => friction),
	} as unknown as Collider;
}

describe(NgteShapeCastWheel.name, () => {
	it('uses the upstream shape-cast range, filter flags, and vehicle exclusion metadata', () => {
		const body = createBody();
		const { context, registeredWheel } = createContext(body);
		const physics = createPhysicsStub();
		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(NgteShapeCastWheel, {
			providers: [
				{ provide: NgtrPhysics, useValue: physics },
				{ provide: NGTE_ECCTRL_VEHICLE_CONTEXT, useValue: context },
			],
		});
		sceneGraphComponentRef.setInput('options', {
			rayShapeR: 0.42,
			rayShapeH: 0.16,
			rayLength: 0.73,
		});
		fixture.detectChanges();

		const ground = createCollider();
		const castShape = vi.fn(() => ({
			collider: ground,
			time_of_impact: 0.2,
			normal1: { x: 0, y: 1, z: 0 },
			witness1: { x: 0, y: 0, z: 0 },
		}));
		const world = {
			timestep: 1 / 60,
			gravity: { x: 0, y: -9.81, z: 0 },
			castShape,
		} as unknown as World;
		const wheel = registeredWheel() ?? sceneGraphComponentRef.instance.info;

		wheel.step(world, 1 / 60);

		expect(castShape).toHaveBeenCalledOnce();
		const args = castShape.mock.calls[0];
		expect(args[3]).toEqual(expect.objectContaining({ halfHeight: 0.16, radius: 0.42 }));
		expect(args[4]).toBe(0);
		expect(args[5]).toBe(0.73);
		expect(args[6]).toBe(false);
		expect(args[7]).toBe(1);
		expect(args[10]).toBe(body);
		const predicate = args[11] as (collider: Collider) => boolean;
		expect(predicate(createCollider())).toBe(true);
		expect(predicate(createCollider({ ecctrl: { excludeCharacterRay: true } }))).toBe(true);
		expect(predicate(createCollider({ ecctrl: { excludeRay: true } }))).toBe(false);
		expect(predicate(createCollider({ ecctrl: { excludeVehicleRay: true } }))).toBe(false);
		expect(wheel.hasContact).toBe(true);
		expect(wheel.suspensionImpulse.y).toBeGreaterThan(0);
	});

	it('keeps upstream rolling resistance while the wheel is airborne', () => {
		const body = createBody();
		const { context, registeredWheel } = createContext(body);
		const physics = createPhysicsStub();
		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(NgteShapeCastWheel, {
			providers: [
				{ provide: NgtrPhysics, useValue: physics },
				{ provide: NGTE_ECCTRL_VEHICLE_CONTEXT, useValue: context },
			],
		});
		fixture.detectChanges();
		Reflect.set(sceneGraphComponentRef.instance, 'wheelAngularVelocity', 10);

		const castShape = vi.fn(() => null);
		const world = { castShape } as unknown as World;
		const wheel = registeredWheel() ?? sceneGraphComponentRef.instance.info;

		wheel.step(world, 1 / 60);

		expect(castShape).toHaveBeenCalledOnce();
		expect(wheel.hasContact).toBe(false);
		expect(wheel.effInertia).toBeGreaterThan(0);
		expect(wheel.wheelAngVel).toBeGreaterThan(0);
		expect(wheel.wheelAngVel).toBeLessThan(10);
	});

	it('does not generate tire impulses when the friction ellipse has no capacity', () => {
		const body = createBody();
		const { context, registeredWheel } = createContext(body);
		const physics = createPhysicsStub();
		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(NgteShapeCastWheel, {
			providers: [
				{ provide: NgtrPhysics, useValue: physics },
				{ provide: NGTE_ECCTRL_VEHICLE_CONTEXT, useValue: context },
			],
		});
		fixture.detectChanges();
		Reflect.set(sceneGraphComponentRef.instance, 'wheelAngularVelocity', 10);

		const ground = createCollider({}, 0);
		const world = {
			castShape: vi.fn(() => ({
				collider: ground,
				time_of_impact: 0.2,
				normal1: { x: 0, y: 1, z: 0 },
				witness1: { x: 0, y: 0, z: 0 },
			})),
		} as unknown as World;
		const wheel = registeredWheel() ?? sceneGraphComponentRef.instance.info;

		wheel.step(world, 1 / 60);
		expect(wheel.lngFricImp.lengthSq()).toBeGreaterThan(0);

		sceneGraphComponentRef.setInput('options', { tireGripFactor: 0 });
		fixture.detectChanges();
		Reflect.set(sceneGraphComponentRef.instance, 'wheelAngularVelocity', 10);
		wheel.step(world, 1 / 60);

		expect(wheel.lngFricImp.lengthSq()).toBe(0);
		expect(wheel.latFricImp.lengthSq()).toBe(0);
		expect(wheel.lngFricImp.toArray().every(Number.isFinite)).toBe(true);
		expect(wheel.latFricImp.toArray().every(Number.isFinite)).toBe(true);
	});
});
