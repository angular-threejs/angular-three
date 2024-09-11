import { computed, effect, ElementRef, inject, Injector } from '@angular/core';
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
import {
	NgtrFixedJointParams,
	NgtrPrismaticJointParams,
	NgtrRevoluteJointParams,
	NgtrRopeJointParams,
	NgtrSphericalJointParams,
	NgtrSpringJointParams,
} from './types';
import { quaternionToRapierQuaternion, vector3ToRapierVector } from './utils';

function injectImpulseJoint<TJoinType extends ImpulseJoint>(
	bodyA: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
	bodyB: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
	{ injector, data }: { injector?: Injector; data: JointData | (() => JointData | null) },
) {
	return assertInjector(injectImpulseJoint, injector, () => {
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
	return (
		bodyA: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
		bodyB: ElementRef<RigidBody> | RigidBody | (() => ElementRef<RigidBody> | RigidBody | undefined | null),
		{ injector, data }: { injector?: Injector; data: TJointParams },
	) => {
		const physics = inject(NgtrPhysics);

		const jointData = computed(() => {
			const rapier = physics.rapier();
			if (!rapier) return null;
			return jointDataFn(rapier, data);
		});

		return injectImpulseJoint<TJoinType>(bodyA, bodyB, { injector, data: jointData });
	};
}

/**
 * A fixed joint ensures that two rigid-bodies don't move relative to each other.
 * Fixed joints are characterized by one local frame (represented by an isometry) on each rigid-body.
 * The fixed-joint makes these frames coincide in world-space.
 *
 * @category Hooks - Joints
 */
export const injectFixedJoint = createJoint<NgtrFixedJointParams, FixedImpulseJoint>((rapier, data) =>
	rapier.JointData.fixed(
		vector3ToRapierVector(data.body1Anchor),
		quaternionToRapierQuaternion(data.body1LocalFrame),
		vector3ToRapierVector(data.body2Anchor),
		quaternionToRapierQuaternion(data.body2LocalFrame),
	),
);

/**
 * The spherical joint ensures that two points on the local-spaces of two rigid-bodies always coincide (it prevents any relative
 * translational motion at this points). This is typically used to simulate ragdolls arms, pendulums, etc.
 * They are characterized by one local anchor on each rigid-body. Each anchor represents the location of the
 * points that need to coincide on the local-space of each rigid-body.
 *
 * @category Hooks - Joints
 */
export const injectSphericalJoint = createJoint<NgtrSphericalJointParams, SphericalImpulseJoint>((rapier, data) =>
	rapier.JointData.spherical(vector3ToRapierVector(data.body1Anchor), vector3ToRapierVector(data.body2Anchor)),
);

/**
 * The revolute joint prevents any relative movement between two rigid-bodies, except for relative
 * rotations along one axis. This is typically used to simulate wheels, fans, etc.
 * They are characterized by one local anchor as well as one local axis on each rigid-body.
 *
 * @category Hooks - Joints
 */
export const injectRevoluteJoint = createJoint<NgtrRevoluteJointParams, RevoluteImpulseJoint>((rapier, data) => {
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
 * The prismatic joint prevents any relative movement between two rigid-bodies, except for relative translations along one axis.
 * It is characterized by one local anchor as well as one local axis on each rigid-body. In 3D, an optional
 * local tangent axis can be specified for each rigid-body.
 *
 * @category Hooks - Joints
 */
export const injectPrismaticJoint = createJoint<NgtrPrismaticJointParams, PrismaticImpulseJoint>((rapier, data) => {
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
 * The rope joint limits the max distance between two bodies.
 * @category Hooks - Joints
 */
export const injectRopeJoint = createJoint<NgtrRopeJointParams, RopeImpulseJoint>((rapier, data) =>
	rapier.JointData.rope(data.length, vector3ToRapierVector(data.body1Anchor), vector3ToRapierVector(data.body2Anchor)),
);

/**
 * The spring joint applies a force proportional to the distance between two objects.
 * @category Hooks - Joints
 */
export const injectSpringJoint = createJoint<NgtrSpringJointParams, SpringImpulseJoint>((rapier, data) =>
	rapier.JointData.spring(
		data.restLength,
		data.stiffness,
		data.damping,
		vector3ToRapierVector(data.body1Anchor),
		vector3ToRapierVector(data.body2Anchor),
	),
);
