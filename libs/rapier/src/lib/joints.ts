import { computed, effect, ElementRef, inject, Injector, untracked } from '@angular/core';
import {
	FixedImpulseJoint,
	ImpulseJoint,
	JointData,
	PrismaticImpulseJoint,
	RevoluteImpulseJoint,
	RigidBody,
	RopeImpulseJoint,
	SphericalImpulseJoint,
	SpringImpulseJoint,
} from '@dimforge/rapier3d-compat';
import { resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { NgtrPhysics } from './physics';
import type {
	NgtrFixedJointParams,
	NgtrPrismaticJointParams,
	NgtrRevoluteJointParams,
	NgtrRopeJointParams,
	NgtrSphericalJointParams,
	NgtrSpringJointParams,
} from './types';
import { quaternionToRapierQuaternion, vector3ToRapierVector } from './utils';

function impulseJoint<TJoinType extends ImpulseJoint>(
	bodyA: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
	bodyB: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
	{ injector, data }: { injector?: Injector; data: JointData | (() => JointData | null) },
) {
	return assertInjector(impulseJoint, injector, () => {
		const physics = inject(NgtrPhysics);

		const newJoint = computed<TJoinType | null>(() => {
			const worldSingleton = physics.worldSingleton();
			if (!worldSingleton) return null;

			const a = typeof bodyA === 'function' ? resolveRef(bodyA()) : resolveRef(bodyA);
			const b = typeof bodyB === 'function' ? resolveRef(bodyB()) : resolveRef(bodyB);
			if (!a || !b) return null;

			const jointData = typeof data === 'function' ? data() : data;
			if (!jointData) return null;

			return worldSingleton.proxy.createImpulseJoint(jointData, a, b, true) as TJoinType;
		});

		effect((onCleanup) => {
			const worldSingleton = physics.worldSingleton();
			if (!worldSingleton) return;

			const joint = newJoint();
			if (!joint) return;

			onCleanup(() => {
				if (worldSingleton.proxy.getImpulseJoint(joint.handle)) {
					worldSingleton.proxy.removeImpulseJoint(joint, true);
				}
			});
		});

		return newJoint;
	});
}

function createJoint<TJointParams, TJoinType extends ImpulseJoint>(
	jointDataFn: (rapier: NonNullable<ReturnType<NgtrPhysics['rapier']>>, data: TJointParams) => JointData,
) {
	return function _injectJoint(
		bodyA: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
		bodyB: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
		{ injector, data }: { injector?: Injector; data: TJointParams | (() => TJointParams) },
	) {
		return assertInjector(_injectJoint, injector, () => {
			const physics = inject(NgtrPhysics);

			let dataFn = data as () => TJointParams;

			if (typeof data !== 'function') {
				dataFn = () => data;
			}

			const jointData = computed(() => {
				const rapier = physics.rapier();
				if (!rapier) return null;
				return jointDataFn(rapier, untracked(dataFn));
			});

			return impulseJoint<TJoinType>(bodyA, bodyB, { injector, data: jointData });
		});
	};
}

/**
 * Creates a fixed joint that prevents any relative movement between two rigid bodies.
 * Fixed joints are characterized by one local frame (represented by an isometry) on each rigid-body.
 * The fixed-joint makes these frames coincide in world-space.
 *
 * @param bodyA - First rigid body (can be RigidBody, ElementRef, or getter function)
 * @param bodyB - Second rigid body (can be RigidBody, ElementRef, or getter function)
 * @param options - Joint configuration with data and optional injector
 * @returns Signal containing the created joint or null
 *
 * @example
 * ```typescript
 * fixedJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body1LocalFrame: [0, 0, 0, 1],
 *     body2Anchor: [0, 0, 0],
 *     body2LocalFrame: [0, 0, 0, 1]
 *   }
 * });
 * ```
 *
 * @category Hooks - Joints
 */
export const fixedJoint = createJoint<NgtrFixedJointParams, FixedImpulseJoint>((rapier, data) =>
	rapier.JointData.fixed(
		vector3ToRapierVector(data.body1Anchor),
		quaternionToRapierQuaternion(data.body1LocalFrame),
		vector3ToRapierVector(data.body2Anchor),
		quaternionToRapierQuaternion(data.body2LocalFrame),
	),
);
/**
 * @deprecated Use `fixedJoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectFixedJoint = fixedJoint;

/**
 * Creates a spherical (ball-and-socket) joint that ensures two anchor points always coincide.
 * This prevents any relative translational motion at these points while allowing rotation.
 * Typically used to simulate ragdoll arms, pendulums, etc.
 *
 * @param bodyA - First rigid body (can be RigidBody, ElementRef, or getter function)
 * @param bodyB - Second rigid body (can be RigidBody, ElementRef, or getter function)
 * @param options - Joint configuration with data and optional injector
 * @returns Signal containing the created joint or null
 *
 * @example
 * ```typescript
 * sphericalJoint(bodyA, bodyB, {
 *   data: { body1Anchor: [0, -0.5, 0], body2Anchor: [0, 0.5, 0] }
 * });
 * ```
 *
 * @category Hooks - Joints
 */
export const sphericalJoint = createJoint<NgtrSphericalJointParams, SphericalImpulseJoint>((rapier, data) =>
	rapier.JointData.spherical(vector3ToRapierVector(data.body1Anchor), vector3ToRapierVector(data.body2Anchor)),
);
/**
 * @deprecated Use `sphericalJoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectSphericalJoint = sphericalJoint;

/**
 * Creates a revolute (hinge) joint that allows rotation only around one axis.
 * Prevents any other relative movement between two rigid bodies.
 * Typically used to simulate wheels, doors, fans, etc.
 *
 * @param bodyA - First rigid body (can be RigidBody, ElementRef, or getter function)
 * @param bodyB - Second rigid body (can be RigidBody, ElementRef, or getter function)
 * @param options - Joint configuration with data (including optional limits) and optional injector
 * @returns Signal containing the created joint or null
 *
 * @example
 * ```typescript
 * revoluteJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [0, 1, 0],
 *     axis: [0, 1, 0],
 *     limits: [-Math.PI / 2, Math.PI / 2]
 *   }
 * });
 * ```
 *
 * @category Hooks - Joints
 */
export const revoluteJoint = createJoint<NgtrRevoluteJointParams, RevoluteImpulseJoint>((rapier, data) => {
	const jointData = rapier.JointData.revolute(
		vector3ToRapierVector(data.body1Anchor),
		vector3ToRapierVector(data.body2Anchor),
		vector3ToRapierVector(data.axis),
	);

	if (data.limits) {
		jointData.limitsEnabled = true;
		jointData.limits = data.limits;
	}

	return jointData;
});
/**
 * @deprecated Use `revoluteJoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectRevoluteJoint = revoluteJoint;

/**
 * Creates a prismatic (slider) joint that allows translation only along one axis.
 * Prevents any other relative movement between two rigid bodies.
 * Typically used to simulate pistons, sliding doors, etc.
 *
 * @param bodyA - First rigid body (can be RigidBody, ElementRef, or getter function)
 * @param bodyB - Second rigid body (can be RigidBody, ElementRef, or getter function)
 * @param options - Joint configuration with data (including optional limits) and optional injector
 * @returns Signal containing the created joint or null
 *
 * @example
 * ```typescript
 * prismaticJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [2, 0, 0],
 *     axis: [1, 0, 0],
 *     limits: [-1, 1]
 *   }
 * });
 * ```
 *
 * @category Hooks - Joints
 */
export const prismaticJoint = createJoint<NgtrPrismaticJointParams, PrismaticImpulseJoint>((rapier, data) => {
	const jointData = rapier.JointData.prismatic(
		vector3ToRapierVector(data.body1Anchor),
		vector3ToRapierVector(data.body2Anchor),
		vector3ToRapierVector(data.axis),
	);

	if (data.limits) {
		jointData.limitsEnabled = true;
		jointData.limits = data.limits;
	}

	return jointData;
});
/**
 * @deprecated Use `prismaticJoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectPrismaticJoint = prismaticJoint;

/**
 * Creates a rope joint that limits the maximum distance between two anchor points.
 * The bodies can move freely as long as the distance doesn't exceed the specified length.
 *
 * @param bodyA - First rigid body (can be RigidBody, ElementRef, or getter function)
 * @param bodyB - Second rigid body (can be RigidBody, ElementRef, or getter function)
 * @param options - Joint configuration with data and optional injector
 * @returns Signal containing the created joint or null
 *
 * @example
 * ```typescript
 * ropeJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [0, 0, 0],
 *     length: 5
 *   }
 * });
 * ```
 *
 * @category Hooks - Joints
 */
export const ropeJoint = createJoint<NgtrRopeJointParams, RopeImpulseJoint>((rapier, data) =>
	rapier.JointData.rope(
		data.length,
		vector3ToRapierVector(data.body1Anchor),
		vector3ToRapierVector(data.body2Anchor),
	),
);
/**
 * @deprecated Use `ropeJoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectRopeJoint = ropeJoint;

/**
 * Creates a spring joint that applies a force proportional to the distance between two anchor points.
 * The spring tries to maintain its rest length through spring forces.
 *
 * @param bodyA - First rigid body (can be RigidBody, ElementRef, or getter function)
 * @param bodyB - Second rigid body (can be RigidBody, ElementRef, or getter function)
 * @param options - Joint configuration with data and optional injector
 * @returns Signal containing the created joint or null
 *
 * @example
 * ```typescript
 * springJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [0, 0, 0],
 *     restLength: 2,
 *     stiffness: 100,
 *     damping: 10
 *   }
 * });
 * ```
 *
 * @category Hooks - Joints
 */
export const springJoint = createJoint<NgtrSpringJointParams, SpringImpulseJoint>((rapier, data) => {
	return rapier.JointData.spring(
		data.restLength,
		data.stiffness,
		data.damping,
		vector3ToRapierVector(data.body1Anchor),
		vector3ToRapierVector(data.body2Anchor),
	);
});
/**
 * @deprecated Use `springJoint` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectSpringJoint = springJoint;
