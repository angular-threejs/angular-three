import { vi } from 'vitest';
import { NgtrPhysics } from './physics';
import type { NgtrWorldStepCallback } from './types';

type StepWorld = {
	timestep: number;
	step: ReturnType<typeof vi.fn>;
	forEachActiveRigidBody: ReturnType<typeof vi.fn>;
};

function createPhysicsStepHarness(timeStep: number | 'vary', paused = false) {
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
		paused: () => paused,
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
	it('manual stepping advances while paused and ignores invalid deltas', () => {
		const internalStep = vi.fn();
		const physics = { internalStep } as unknown as NgtrPhysics;

		NgtrPhysics.prototype.step.call(physics, 1 / 60);
		NgtrPhysics.prototype.step.call(physics, 0);
		NgtrPhysics.prototype.step.call(physics, Number.NaN);

		expect(internalStep).toHaveBeenCalledOnce();
		expect(internalStep).toHaveBeenCalledWith(1 / 60);
	});

	it('automatic stepping alone respects the paused option', () => {
		const step = vi.fn();
		const automaticStep = Reflect.get(NgtrPhysics.prototype, 'automaticStep') as (
			this: { paused: () => boolean; step: (delta: number) => void },
			delta: number,
		) => void;
		const physics = { paused: () => true, step };

		automaticStep.call(physics, 1 / 60);
		expect(step).not.toHaveBeenCalled();

		physics.paused = () => false;
		automaticStep.call(physics, 1 / 60);
		expect(step).toHaveBeenCalledWith(1 / 60);
	});

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

	it('manually advances a paused variable-timestep world by the exact requested delta', () => {
		const delta = 0.125;
		const { eventQueue, internalStep, physics, world } = createPhysicsStepHarness('vary', true);
		const beforeStep = vi.fn();
		const afterStep = vi.fn();
		physics.beforeStepCallbacks.add(beforeStep);
		physics.afterStepCallbacks.add(afterStep);
		Reflect.set(physics, 'internalStep', internalStep.bind(physics));

		NgtrPhysics.prototype.step.call(physics, delta);

		expect(world.timestep).toBe(delta);
		expect(beforeStep).toHaveBeenCalledWith(world, delta);
		expect(world.step).toHaveBeenCalledWith(eventQueue, undefined);
		expect(afterStep).toHaveBeenCalledWith(world, delta);
	});
});
