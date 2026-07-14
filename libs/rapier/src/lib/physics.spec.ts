import { vi } from 'vitest';
import { NgtrPhysics } from './physics';
import type { NgtrWorldStepCallback } from './types';

type StepWorld = {
	timestep: number;
	step: ReturnType<typeof vi.fn>;
	forEachActiveRigidBody: ReturnType<typeof vi.fn>;
};

function createPhysicsStepHarness(timeStep: number | 'vary') {
	const world: StepWorld = {
		timestep: 0,
		step: vi.fn(),
		forEachActiveRigidBody: vi.fn(),
	};
	const eventQueue = {
		drainCollisionEvents: vi.fn(),
		drainContactForceEvents: vi.fn(),
	};
	const physics = {
		worldSingleton: () => ({ proxy: world }),
		eventQueue: () => eventQueue,
		timeStep: () => timeStep,
		interpolate: () => false,
		paused: () => false,
		beforeStepCallbacks: new Set<NgtrWorldStepCallback>(),
		afterStepCallbacks: new Set<NgtrWorldStepCallback>(),
		filterContactPairCallbacks: new Set(),
		filterIntersectionPairCallbacks: new Set(),
		rigidBodyStates: new Map(),
		colliderStates: new Map(),
		rigidBodyEvents: new Map(),
		colliderEvents: new Map(),
		store: { snapshot: { invalidate: vi.fn() } },
		steppingState: { accumulator: 0, previousState: {} },
	} as unknown as NgtrPhysics;

	const internalStep = Reflect.get(NgtrPhysics.prototype, 'internalStep') as (
		this: NgtrPhysics,
		delta: number,
	) => void;

	return { eventQueue, internalStep, physics, world };
}

describe(NgtrPhysics.name, () => {
	it('sets and supplies the current fixed timestep before pre-step callbacks run', () => {
		const fixedTimeStep = 1 / 60;
		const { internalStep, physics, world } = createPhysicsStepHarness(fixedTimeStep);
		const observedTimesteps: number[] = [];
		const observedDeltas: number[] = [];

		const legacyCallback: NgtrWorldStepCallback = (callbackWorld) => {
			observedTimesteps.push(callbackWorld.timestep);
		};
		const callbackWithDelta: NgtrWorldStepCallback = (callbackWorld, delta) => {
			observedTimesteps.push(callbackWorld.timestep);
			observedDeltas.push(delta!);
		};
		physics.beforeStepCallbacks.add(legacyCallback);
		physics.beforeStepCallbacks.add(callbackWithDelta);

		internalStep.call(physics, fixedTimeStep * 2);

		expect(observedTimesteps).toEqual([fixedTimeStep, fixedTimeStep, fixedTimeStep, fixedTimeStep]);
		expect(observedDeltas).toEqual([fixedTimeStep, fixedTimeStep]);
		expect(world.step).toHaveBeenCalledTimes(2);
	});
});
