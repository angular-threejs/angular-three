import { signal } from '@angular/core';
import { NgtrPhysics } from 'angular-three-rapier';
import { NgtTestBed } from 'angular-three/testing';
import * as THREE from 'three';
import { vi } from 'vitest';
import { NgteEcctrl } from './ecctrl';
import { NgteEcctrlGravity } from './gravity';

type Vector = { x: number; y: number; z: number };
type PhysicsStep = (world: unknown, delta?: number) => void;

function vector(x = 0, y = 0, z = 0): Vector {
	return { x, y, z };
}

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
		rapier: signal<unknown>(null),
	};
}

function createRigidBody({
	position = vector(),
	linearVelocity = vector(),
	angularVelocity = vector(),
	rotation = { x: 0, y: 0, z: 0, w: 1 },
	mass = 1,
	sleeping = false,
	dynamic = true,
	kinematic = false,
}: {
	position?: Vector;
	linearVelocity?: Vector;
	angularVelocity?: Vector;
	rotation?: { x: number; y: number; z: number; w: number };
	mass?: number;
	sleeping?: boolean;
	dynamic?: boolean;
	kinematic?: boolean;
} = {}) {
	const state = {
		position: { ...position },
		linearVelocity: { ...linearVelocity },
		angularVelocity: { ...angularVelocity },
		rotation: { ...rotation },
		gravityScale: 1,
		sleeping,
	};

	return {
		handle: 1,
		userData: {},
		state,
		translation: vi.fn(() => ({ ...state.position })),
		linvel: vi.fn(() => ({ ...state.linearVelocity })),
		angvel: vi.fn(() => ({ ...state.angularVelocity })),
		rotation: vi.fn(() => ({ ...state.rotation })),
		mass: vi.fn(() => mass),
		gravityScale: vi.fn(() => state.gravityScale),
		isSleeping: vi.fn(() => state.sleeping),
		isDynamic: vi.fn(() => dynamic),
		isKinematic: vi.fn(() => kinematic),
		isFixed: vi.fn(() => !dynamic && !kinematic),
		wakeUp: vi.fn(() => {
			state.sleeping = false;
		}),
		setEnabled: vi.fn(),
		setGravityScale: vi.fn((gravityScale: number) => {
			state.gravityScale = gravityScale;
		}),
		setLinvel: vi.fn((velocity: Vector) => {
			state.linearVelocity = { ...velocity };
		}),
		setRotation: vi.fn((nextRotation: { x: number; y: number; z: number; w: number }) => {
			state.rotation = { ...nextRotation };
		}),
		applyImpulse: vi.fn(),
		applyImpulseAtPoint: vi.fn(),
		applyTorqueImpulse: vi.fn(),
		worldCom: vi.fn(() => ({ ...state.position })),
		velocityAtPoint: vi.fn(() => vector()),
	};
}

function createCollider(parent: ReturnType<typeof createRigidBody> | null = null) {
	return {
		handle: 2,
		parent: vi.fn(() => parent),
		isSensor: vi.fn(() => false),
		friction: vi.fn(() => 0.5),
	};
}

type ShapeHit = {
	collider: ReturnType<typeof createCollider>;
	time_of_impact: number;
	toi: number;
	normal1: Vector;
	normal2: Vector;
	witness1: Vector;
};

function createShapeHit(
	collider: ReturnType<typeof createCollider>,
	{
		timeOfImpact = 0.2,
		normal1 = vector(0, 1, 0),
		normal2 = vector(1, 0, 0),
		witness1 = vector(7, 8, 9),
	}: Partial<{
		timeOfImpact: number;
		normal1: Vector;
		normal2: Vector;
		witness1: Vector;
	}> = {},
): ShapeHit {
	return {
		collider,
		time_of_impact: timeOfImpact,
		toi: timeOfImpact,
		normal1,
		normal2,
		witness1,
	};
}

function createWorld(shapeHit: ShapeHit | null) {
	return {
		timestep: 1 / 60,
		gravity: vector(0, -9.81, 0),
		castShape: vi.fn(() => shapeHit),
		castRayAndGetNormal: vi.fn(() => null),
		intersectionsWithRay: vi.fn(),
	};
}

class FakeRay {
	constructor(
		readonly origin: Vector,
		readonly direction: Vector,
	) {}
}

class FakeBall {
	constructor(readonly radius: number) {}
}

function createRapierStub() {
	return {
		Ray: FakeRay,
		Ball: FakeBall,
		QueryFilterFlags: { EXCLUDE_SENSORS: 1 },
	};
}

function mountController({
	body = createRigidBody(),
	collider = createCollider(),
	shapeHit = createShapeHit(collider),
	gravity,
}: {
	body?: ReturnType<typeof createRigidBody>;
	collider?: ReturnType<typeof createCollider>;
	shapeHit?: ShapeHit | null;
	gravity?: NgteEcctrlGravity;
} = {}) {
	const physics = createPhysicsStub();
	const { fixture, scene, sceneGraphComponentRef, toGraph } = NgtTestBed.create(NgteEcctrl, {
		providers: [
			{ provide: NgtrPhysics, useValue: physics },
			...(gravity ? [{ provide: NgteEcctrlGravity, useValue: gravity }] : []),
		],
	});
	const controller = sceneGraphComponentRef.instance;

	// The real directives intentionally remain uninitialized in a headless scene.
	// Swap their public runtime signals only after the component has mounted, then
	// exercise the actual callback registered through `beforePhysicsStep`.
	(controller as unknown as { body: unknown }).body = signal(body);
	(controller as unknown as { collider: unknown }).collider = signal(collider);
	physics.rapier.set(createRapierStub());

	const world = createWorld(shapeHit);
	const step = [...physics.beforeStepCallbacks][0];
	if (!step) throw new Error('NgteEcctrl did not register a physics callback.');

	return {
		body,
		collider,
		controller,
		fixture,
		physics,
		scene,
		toGraph,
		world,
		setOptions(options: Record<string, unknown>) {
			sceneGraphComponentRef.setInput('options', options);
			fixture.detectChanges();
		},
		step(delta: number) {
			step(world, delta);
		},
	};
}

describe(NgteEcctrl.name, () => {
	it('creates its owned scene graph through angular-three/testing', () => {
		const { controller, physics, scene, toGraph } = mountController();

		expect(scene.children).toHaveLength(1);
		expect(toGraph()).toContainEqual(
			expect.objectContaining({
				type: 'Object3D',
				name: '',
				children: [expect.objectContaining({ type: 'Object3D' })],
			}),
		);
		expect(physics.beforeStepCallbacks.size).toBe(1);
		expect(controller.handle.body).not.toBeNull();
	});

	it('merges imperative movement input instead of replacing it', () => {
		const { controller } = mountController();

		controller.setMovement({ forward: true, joystick: { x: 0.25, y: -0.5 } });
		controller.setMovement({ run: true });

		expect(controller.movement()).toEqual({
			forward: true,
			joystick: { x: 0.25, y: -0.5 },
			run: true,
		});
	});

	it('uses the source-fidelity shape-cast witness and normal for grounded state', () => {
		const collider = createCollider();
		const hit = createShapeHit(collider, {
			normal1: vector(0, 1, 0),
			normal2: vector(1, 0, 0),
			witness1: vector(7, 8, 9),
		});
		const harness = mountController({ collider, shapeHit: hit });
		harness.world.timestep = 1 / 60;

		harness.step(1 / 120);

		const castArguments = harness.world.castShape.mock.calls[0];
		expect(castArguments[4]).toBe(0);
		expect(harness.controller.state()).toMatchObject({
			grounded: true,
			groundNormal: expect.objectContaining({ x: 0, y: 1, z: 0 }),
			groundPoint: expect.objectContaining({ x: 7, y: 8, z: 9 }),
		});
	});

	it('applies a position-dependent custom gravity field using the supplied substep delta', () => {
		const body = createRigidBody({ position: vector(4, 5, 6), mass: 2 });
		const harness = mountController({ body, shapeHit: null });
		const gravityField = vi.fn((position: THREE.Vector3) => new THREE.Vector3(position.x, -9.81, position.z));
		harness.setOptions({
			enableCustomGravity: true,
			gravityDirLerpSpeed: 1_000_000,
			gravityField,
		});
		harness.world.timestep = 1 / 60;

		harness.step(1 / 120);

		expect(gravityField).toHaveBeenCalledWith(expect.objectContaining({ x: 4, y: 5, z: 6 }));
		const [gravityImpulse, wakeUp] = body.applyImpulse.mock.calls[0];
		expect(gravityImpulse).toMatchObject({
			x: 4 / 60,
			y: -9.81 / 60,
			z: 0.1,
		});
		expect(wakeUp).toBe(false);
	});

	it('does not apply controller impulses for a zero-duration Rapier substep', () => {
		const harness = mountController({ shapeHit: null });

		harness.step(0);

		expect(harness.world.castShape).not.toHaveBeenCalled();
		expect(harness.body.applyImpulse).not.toHaveBeenCalled();
		expect(harness.body.applyTorqueImpulse).not.toHaveBeenCalled();
	});

	it('uses the injectable gravity field when a controller does not supply an override', () => {
		const body = createRigidBody({ position: vector(0, 5, 0), mass: 2 });
		const gravity = new NgteEcctrlGravity();
		const gravityField = vi.fn((position: THREE.Vector3) => new THREE.Vector3(0, -position.y, 0));
		gravity.setGravityField(gravityField);
		const harness = mountController({ body, gravity, shapeHit: null });
		harness.setOptions({ enableCustomGravity: true });

		harness.step(0.01);

		expect(gravityField).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 5, z: 0 }));
		const [gravityImpulse, wakeUp] = body.applyImpulse.mock.calls[0];
		expect(gravityImpulse).toMatchObject({ x: 0, y: -0.1, z: 0 });
		expect(wakeUp).toBe(false);
	});

	it('keeps passive balancing, floating, and friction impulses from waking an idle body', () => {
		const body = createRigidBody({ angularVelocity: vector(0.2, 0, 0), linearVelocity: vector(0.5, 0, 0) });
		const harness = mountController({ body });

		harness.step(1 / 60);

		expect(body.wakeUp).not.toHaveBeenCalled();
		expect(body.applyTorqueImpulse).toHaveBeenCalled();
		expect(body.applyImpulse).toHaveBeenCalled();
		for (const [, wakeUp] of [...body.applyTorqueImpulse.mock.calls, ...body.applyImpulse.mock.calls]) {
			expect(wakeUp).toBe(false);
		}
	});

	it('keeps a held jump active across grounded physics steps', () => {
		const harness = mountController();
		harness.setOptions({ jumpDuration: 0.1 });
		harness.controller.setMovement({ jump: true });

		harness.step(0.02);
		harness.step(0.02);
		harness.step(0.02);

		expect(harness.body.setLinvel).toHaveBeenCalledTimes(3);
		expect(harness.controller.state().jumping).toBe(true);
	});

	it('unregisters its physics callback when the mounted scene is destroyed', () => {
		const harness = mountController();

		expect(harness.physics.beforeStepCallbacks.size).toBe(1);
		harness.fixture.destroy();
		expect(harness.physics.beforeStepCallbacks.size).toBe(0);
	});
});
