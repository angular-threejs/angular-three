import { ElementRef, Injector, Signal, computed, effect, inject, isSignal, signal, untracked } from '@angular/core';
import {
	ConeTwistConstraintOpts,
	ConstraintTypes,
	DistanceConstraintOpts,
	HingeConstraintOpts,
	LockConstraintOpts,
	PointToPointConstraintOpts,
} from '@pmndrs/cannon-worker-api';
import { makeId, resolveRef } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * API for controlling a physics constraint between two bodies.
 * Provides methods to enable, disable, and remove the constraint.
 */
export interface NgtcConstraintApi {
	/** Disable the constraint, allowing bodies to move freely */
	disable: () => void;
	/** Enable the constraint, restricting body movement */
	enable: () => void;
	/** Remove the constraint from the physics world entirely */
	remove: () => void;
}

/**
 * Extended API for hinge constraints with motor control.
 * Adds motor-specific methods on top of the base constraint API.
 */
export interface NgtcHingeConstraintApi extends NgtcConstraintApi {
	/** Disable the hinge motor */
	disableMotor: () => void;
	/** Enable the hinge motor for powered rotation */
	enableMotor: () => void;
	/**
	 * Set the maximum force the motor can apply.
	 * @param value - Maximum force in Newtons
	 */
	setMotorMaxForce: (value: number) => void;
	/**
	 * Set the target angular velocity of the motor.
	 * @param value - Target speed in radians per second
	 */
	setMotorSpeed: (value: number) => void;
}

/**
 * Conditional type that returns the appropriate API type based on constraint type.
 * Returns NgtcHingeConstraintApi for 'Hinge', NgtcConstraintApi for all others.
 * @template T - The constraint type
 */
export type NgtcConstraintORHingeApi<T extends 'Hinge' | ConstraintTypes> = T extends ConstraintTypes
	? NgtcConstraintApi
	: NgtcHingeConstraintApi;

/**
 * Maps constraint types to their configuration option types.
 */
export type NgtcConstraintOptionsMap = {
	/** Options for cone-twist constraints (ball-socket with limits) */
	ConeTwist: ConeTwistConstraintOpts;
	/** Options for point-to-point constraints (ball-socket) */
	PointToPoint: PointToPointConstraintOpts;
	/** Options for distance constraints (fixed distance between points) */
	Distance: DistanceConstraintOpts;
	/** Options for lock constraints (bodies locked together) */
	Lock: LockConstraintOpts;
	/** Options for hinge constraints (single-axis rotation) */
	Hinge: HingeConstraintOpts;
};

/**
 * Configuration options for creating a physics constraint.
 * @template TConstraintType - The type of constraint being created
 */
export type NgtcConstraintOptions<TConstraintType extends 'Hinge' | ConstraintTypes> = {
	/**
	 * Angular injector to use for dependency injection.
	 * If not provided, uses the current injection context.
	 */
	injector?: Injector;
	/**
	 * Whether to create the constraint in a disabled state.
	 * @default false
	 */
	disableOnStart?: boolean;
	/** Constraint-specific configuration options */
	options?: NgtcConstraintOptionsMap[TConstraintType];
};

function createConstraint<TConstraint extends ConstraintTypes | 'Hinge'>(type: TConstraint) {
	return <A extends THREE.Object3D = THREE.Object3D, B extends THREE.Object3D = THREE.Object3D>(
		bodyA: ElementRef<A> | A | Signal<ElementRef<A> | A | undefined>,
		bodyB: ElementRef<B> | B | Signal<ElementRef<B> | B | undefined>,
		options?: NgtcConstraintOptions<TConstraint>,
	) => constraint<TConstraint, A, B>(type, bodyA, bodyB, options);
}

function constraint<
	TConstraint extends ConstraintTypes | 'Hinge',
	A extends THREE.Object3D = THREE.Object3D,
	B extends THREE.Object3D = THREE.Object3D,
>(
	type: TConstraint,
	bodyA: ElementRef<A> | A | Signal<ElementRef<A> | A | undefined>,
	bodyB: ElementRef<B> | B | Signal<ElementRef<B> | B | undefined>,
	{
		injector,
		options = {} as NgtcConstraintOptionsMap[TConstraint],
		disableOnStart = false,
	}: NgtcConstraintOptions<TConstraint> = {},
) {
	return assertInjector(constraint, injector, () => {
		const physics = inject(NgtcPhysics, { optional: true });

		if (!physics) {
			throw new Error(`[NGT Cannon] injectConstraint was called outside of <ngtc-physics>`);
		}

		const worker = physics.worker;

		const uuid = makeId();
		const bodyARef = isSignal(bodyA) ? bodyA : signal(bodyA);
		const bodyBRef = isSignal(bodyB) ? bodyB : signal(bodyB);
		const bodyAValue = computed(() => resolveRef(bodyARef()));
		const bodyBValue = computed(() => resolveRef(bodyBRef()));

		const constraintApi = computed(() => {
			const _worker = worker();
			if (!_worker) return null;

			const enableDisable = {
				disable: () => _worker.disableConstraint({ uuid }),
				enable: () => _worker.enableConstraint({ uuid }),
				remove: () => _worker.removeConstraint({ uuid }),
			};
			if (type === 'Hinge') {
				return {
					...enableDisable,
					disableMotor: () => _worker.disableConstraintMotor({ uuid }),
					enableMotor: () => _worker.enableConstraintMotor({ uuid }),
					setMotorMaxForce: (value: number) => _worker.setConstraintMotorMaxForce({ props: value, uuid }),
					setMotorSpeed: (value: number) => _worker.setConstraintMotorSpeed({ props: value, uuid }),
				} as NgtcHingeConstraintApi;
			}
			return enableDisable as NgtcConstraintApi;
		});

		let alreadyDisabled = false;
		effect((onCleanup) => {
			const currentWorker = worker();
			if (!currentWorker) return;

			const [a, b, api] = [bodyAValue(), bodyBValue(), untracked(constraintApi)];
			if (!a || !b) return;

			currentWorker.addConstraint({
				props: [a.uuid, b.uuid, options],
				type,
				uuid,
			});

			if (disableOnStart && !alreadyDisabled) {
				alreadyDisabled = true;
				api?.disable();
			}

			onCleanup(() => currentWorker.removeConstraint({ uuid }));
		});

		return constraintApi;
	});
}

/**
 * Creates a point-to-point (ball-socket) constraint between two physics bodies.
 * This constraint keeps the pivot points of both bodies at the same world position.
 *
 * @param bodyA - Reference to the first physics body's Three.js object
 * @param bodyB - Reference to the second physics body's Three.js object
 * @param options - Optional constraint configuration
 * @returns Signal containing the constraint API, or null if not ready
 *
 * @example
 * ```typescript
 * const meshA = viewChild.required<ElementRef<Mesh>>('meshA');
 * const meshB = viewChild.required<ElementRef<Mesh>>('meshB');
 * const api = pointToPoint(meshA, meshB, {
 *   options: { pivotA: [0, 1, 0], pivotB: [0, -1, 0] }
 * });
 * ```
 */
export const pointToPoint = createConstraint('PointToPoint');

/**
 * Creates a cone-twist constraint between two physics bodies.
 * Similar to a ball-socket joint but with configurable angular limits.
 *
 * @param bodyA - Reference to the first physics body's Three.js object
 * @param bodyB - Reference to the second physics body's Three.js object
 * @param options - Optional constraint configuration
 * @returns Signal containing the constraint API, or null if not ready
 *
 * @example
 * ```typescript
 * const meshA = viewChild.required<ElementRef<Mesh>>('meshA');
 * const meshB = viewChild.required<ElementRef<Mesh>>('meshB');
 * const api = coneTwist(meshA, meshB, {
 *   options: {
 *     pivotA: [0, 1, 0],
 *     pivotB: [0, -1, 0],
 *     axisA: [0, 1, 0],
 *     axisB: [0, 1, 0],
 *     angle: Math.PI / 4,
 *     twistAngle: Math.PI / 8
 *   }
 * });
 * ```
 */
export const coneTwist = createConstraint('ConeTwist');

/**
 * Creates a distance constraint between two physics bodies.
 * Maintains a fixed distance between two points on the bodies.
 *
 * @param bodyA - Reference to the first physics body's Three.js object
 * @param bodyB - Reference to the second physics body's Three.js object
 * @param options - Optional constraint configuration
 * @returns Signal containing the constraint API, or null if not ready
 *
 * @example
 * ```typescript
 * const meshA = viewChild.required<ElementRef<Mesh>>('meshA');
 * const meshB = viewChild.required<ElementRef<Mesh>>('meshB');
 * const api = distance(meshA, meshB, {
 *   options: { distance: 5 }
 * });
 * ```
 */
export const distance = createConstraint('Distance');

/**
 * Creates a lock constraint between two physics bodies.
 * Locks the bodies together at their current relative positions and orientations.
 *
 * @param bodyA - Reference to the first physics body's Three.js object
 * @param bodyB - Reference to the second physics body's Three.js object
 * @param options - Optional constraint configuration
 * @returns Signal containing the constraint API, or null if not ready
 *
 * @example
 * ```typescript
 * const meshA = viewChild.required<ElementRef<Mesh>>('meshA');
 * const meshB = viewChild.required<ElementRef<Mesh>>('meshB');
 * const api = lock(meshA, meshB);
 * ```
 */
export const lock = createConstraint('Lock');

/**
 * Creates a hinge constraint between two physics bodies.
 * Allows rotation around a single axis, like a door hinge.
 * Includes motor control for powered rotation.
 *
 * @param bodyA - Reference to the first physics body's Three.js object
 * @param bodyB - Reference to the second physics body's Three.js object
 * @param options - Optional constraint configuration
 * @returns Signal containing the hinge constraint API with motor controls, or null if not ready
 *
 * @example
 * ```typescript
 * const door = viewChild.required<ElementRef<Mesh>>('door');
 * const frame = viewChild.required<ElementRef<Mesh>>('frame');
 * const api = hinge(door, frame, {
 *   options: {
 *     pivotA: [-1, 0, 0],
 *     pivotB: [1, 0, 0],
 *     axisA: [0, 1, 0],
 *     axisB: [0, 1, 0]
 *   }
 * });
 *
 * // Enable motor for automatic rotation
 * api()?.enableMotor();
 * api()?.setMotorSpeed(2);
 * api()?.setMotorMaxForce(100);
 * ```
 */
export const hinge = createConstraint('Hinge');

/**
 * @deprecated Use `pointToPoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectPointToPoint = pointToPoint;

/**
 * @deprecated Use `coneTwist` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectConeTwist = coneTwist;

/**
 * @deprecated Use `distance` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectDistance = distance;

/**
 * @deprecated Use `lock` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectLock = lock;

/**
 * @deprecated Use `hinge` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectHinge = hinge;
