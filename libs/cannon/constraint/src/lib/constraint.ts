import { Injector, afterNextRender } from '@angular/core';
import {
	ConeTwistConstraintOpts,
	ConstraintTypes,
	DistanceConstraintOpts,
	HingeConstraintOpts,
	LockConstraintOpts,
	PointToPointConstraintOpts,
} from '@pmndrs/cannon-worker-api';
import { NgtInjectedRef, injectNgtRef, is, makeId } from 'angular-three';
import { injectNgtcPhysicsApi } from 'angular-three-cannon';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Object3D } from 'three';

export interface NgtcConstraintApi {
	disable: () => void;
	enable: () => void;
	remove: () => void;
}

export interface NgtcHingeConstraintApi extends NgtcConstraintApi {
	disableMotor: () => void;
	enableMotor: () => void;
	setMotorMaxForce: (value: number) => void;
	setMotorSpeed: (value: number) => void;
}

export type NgtcConstraintORHingeApi<T extends 'Hinge' | ConstraintTypes> = T extends ConstraintTypes
	? NgtcConstraintApi
	: NgtcHingeConstraintApi;

export interface NgtcConstraintReturn<
	T extends 'Hinge' | ConstraintTypes,
	TObjectA extends Object3D = Object3D,
	TObjectB extends Object3D = Object3D,
> {
	bodyA: NgtInjectedRef<TObjectA>;
	bodyB: NgtInjectedRef<TObjectB>;
	api: NgtcConstraintORHingeApi<T>;
}

export type NgtcConstraintOptionsMap = {
	ConeTwist: ConeTwistConstraintOpts;
	PointToPoint: PointToPointConstraintOpts;
	Distance: DistanceConstraintOpts;
	Lock: LockConstraintOpts;
	Hinge: HingeConstraintOpts;
};

export type NgtcConstraintOptions<TConstraintType extends 'Hinge' | ConstraintTypes> = {
	injector?: Injector;
	options?: NgtcConstraintOptionsMap[TConstraintType];
};

function createInjectConstraint<TConstraint extends ConstraintTypes | 'Hinge'>(type: TConstraint) {
	return <A extends Object3D = Object3D, B extends Object3D = Object3D>(
		bodyA: NgtInjectedRef<A> | A,
		bodyB: NgtInjectedRef<B> | B,
		options?: NgtcConstraintOptions<TConstraint>,
	) => injectConstraint<TConstraint, A, B>(type, bodyA, bodyB, options);
}

function injectConstraint<
	TConstraint extends ConstraintTypes | 'Hinge',
	A extends Object3D = Object3D,
	B extends Object3D = Object3D,
>(
	type: TConstraint,
	bodyA: NgtInjectedRef<A> | A,
	bodyB: NgtInjectedRef<B> | B,
	{ injector, options = {} as any }: NgtcConstraintOptions<TConstraint> = {},
): NgtcConstraintReturn<TConstraint, A, B> {
	return assertInjector(injectConstraint, injector, () => {
		const physicsApi = injectNgtcPhysicsApi();

		if (!physicsApi) {
			throw new Error(`[NGT Cannon] injectConstraint was called outside of <ngtc-physics>`);
		}

		const autoEffect = injectAutoEffect();

		const uuid = makeId();
		const bodyARef = is.ref(bodyA) ? bodyA : injectNgtRef(bodyA);
		const bodyBRef = is.ref(bodyB) ? bodyB : injectNgtRef(bodyB);
		const constraintResult = { bodyA: bodyARef, bodyB: bodyBRef };

		afterNextRender(() => {
			Object.assign(constraintResult, {
				api: (() => {
					const enableDisable = {
						disable: () => physicsApi.worker().disableConstraint({ uuid }),
						enable: () => physicsApi.worker().enableConstraint({ uuid }),
						remove: () => physicsApi.worker().removeConstraint({ uuid }),
					};
					if (type === 'Hinge') {
						return {
							...enableDisable,
							disableMotor: () => physicsApi.worker().disableConstraintMotor({ uuid }),
							enableMotor: () => physicsApi.worker().enableConstraintMotor({ uuid }),
							setMotorMaxForce: (value: number) =>
								physicsApi.worker().setConstraintMotorMaxForce({ props: value, uuid }),
							setMotorSpeed: (value: number) => physicsApi.worker().setConstraintMotorSpeed({ props: value, uuid }),
						} as NgtcHingeConstraintApi;
					}
					return enableDisable as NgtcConstraintApi;
				})(),
			});

			autoEffect(() => {
				const [a, b] = [bodyARef.nativeElement, bodyBRef.nativeElement];

				if (a && b) {
					physicsApi.worker().addConstraint({
						props: [a.uuid, b.uuid, options],
						type,
						uuid,
					});
					return () => physicsApi.worker().removeConstraint({ uuid });
				}

				return;
			});
		});

		return constraintResult as NgtcConstraintReturn<TConstraint, A, B>;
	});
}

export const injectPointToPoint = createInjectConstraint('PointToPoint');
export const injectConeTwist = createInjectConstraint('ConeTwist');
export const injectDistance = createInjectConstraint('Distance');
export const injectLock = createInjectConstraint('Lock');
export const injectHinge = createInjectConstraint('Hinge');
