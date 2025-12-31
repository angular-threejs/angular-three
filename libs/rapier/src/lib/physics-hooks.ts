import { DestroyRef, inject, Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { NgtrPhysics } from './physics';
import type { NgtrFilterContactPairCallback, NgtrFilterIntersectionPairCallback, NgtrWorldStepCallback } from './types';

/**
 * Registers a callback to be executed before each physics world step.
 * Useful for applying forces, updating kinematic bodies, or other pre-step logic.
 *
 * The callback is automatically unregistered when the component is destroyed.
 *
 * @param callback - Function to call before each physics step, receives the Rapier World
 * @param injector - Optional injector for dependency injection context
 *
 * @example
 * ```typescript
 * beforePhysicsStep((world) => {
 *   // Apply custom forces or update kinematic bodies
 *   const body = world.getRigidBody(handle);
 *   body?.applyImpulse({ x: 0, y: 10, z: 0 }, true);
 * });
 * ```
 */
export function beforePhysicsStep(callback: NgtrWorldStepCallback, injector?: Injector) {
	return assertInjector(beforePhysicsStep, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.beforeStepCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.beforeStepCallbacks.delete(callback);
		});
	});
}

/**
 * Registers a callback to be executed after each physics world step.
 * Useful for reading physics state, updating visuals, or other post-step logic.
 *
 * The callback is automatically unregistered when the component is destroyed.
 *
 * @param callback - Function to call after each physics step, receives the Rapier World
 * @param injector - Optional injector for dependency injection context
 *
 * @example
 * ```typescript
 * afterPhysicsStep((world) => {
 *   // Read physics state after simulation
 *   const body = world.getRigidBody(handle);
 *   const position = body?.translation();
 *   console.log('Body position:', position);
 * });
 * ```
 */
export function afterPhysicsStep(callback: NgtrWorldStepCallback, injector?: Injector) {
	return assertInjector(afterPhysicsStep, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.afterStepCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.afterStepCallbacks.delete(callback);
		});
	});
}

/**
 * Registers a callback to filter contact pairs.
 *
 * The callback determines if contact computation should happen between two colliders,
 * and how the constraints solver should behave for these contacts.
 *
 * This will only be executed if at least one of the involved colliders contains the
 * `ActiveHooks.FILTER_CONTACT_PAIRS` flag in its active hooks.
 *
 * @param callback - Function that returns:
 *   - `SolverFlags.COMPUTE_IMPULSE` (1) - Process the collision normally
 *   - `SolverFlags.EMPTY` (0) - Skip computing impulses (colliders pass through)
 *   - `null` - Skip this hook; let the next registered hook decide
 *
 * When multiple hooks are registered, they are called in order until one returns a non-null value.
 */
export function filterContactPair(callback: NgtrFilterContactPairCallback, injector?: Injector) {
	return assertInjector(filterContactPair, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.filterContactPairCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.filterContactPairCallbacks.delete(callback);
		});
	});
}

/**
 * Registers a callback to filter intersection pairs.
 *
 * The callback determines if intersection computation should happen between two colliders
 * (where at least one is a sensor).
 *
 * This will only be executed if at least one of the involved colliders contains the
 * `ActiveHooks.FILTER_INTERSECTION_PAIR` flag in its active hooks.
 *
 * @param callback - Function that returns:
 *   - `true` - Allow the intersection to be detected
 *   - `false` - Block the intersection (no intersection events will fire)
 *
 * When multiple hooks are registered, the first hook that returns `false` blocks the intersection.
 */
export function filterIntersectionPair(callback: NgtrFilterIntersectionPairCallback, injector?: Injector) {
	return assertInjector(filterIntersectionPair, injector, () => {
		const physics = inject(NgtrPhysics);

		physics.filterIntersectionPairCallbacks.add(callback);

		inject(DestroyRef).onDestroy(() => {
			physics.filterIntersectionPairCallbacks.delete(callback);
		});
	});
}
