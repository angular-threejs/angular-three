import { ElementRef, Injector, afterNextRender } from '@angular/core';
import {
	ConeTwistConstraintOpts,
	ConstraintTypes,
	DistanceConstraintOpts,
	HingeConstraintOpts,
	LockConstraintOpts,
	PointToPointConstraintOpts,
} from '@pmndrs/cannon-worker-api';
import { NgtInjectedRef, injectNgtRef, makeId } from 'angular-three';
import { injectPhysicsApi } from 'angular-three-cannon';
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
	disableOnStart?: boolean;
	options?: NgtcConstraintOptionsMap[TConstraintType];
};

function createInjectConstraint<TConstraint extends ConstraintTypes | 'Hinge'>(type: TConstraint) {
	return <A extends Object3D = Object3D, B extends Object3D = Object3D>(
		bodyA: ElementRef<A> | A,
		bodyB: ElementRef<B> | B,
		options?: NgtcConstraintOptions<TConstraint>,
	) => injectConstraint<TConstraint, A, B>(type, bodyA, bodyB, options);
}

function injectConstraint<
	TConstraint extends ConstraintTypes | 'Hinge',
	A extends Object3D = Object3D,
	B extends Object3D = Object3D,
>(
	type: TConstraint,
	bodyA: ElementRef<A> | A,
	bodyB: ElementRef<B> | B,
	{ injector, options = {} as any, disableOnStart = false }: NgtcConstraintOptions<TConstraint> = {},
): NgtcConstraintReturn<TConstraint, A, B> {
	return assertInjector(injectConstraint, injector, () => {
		const physicsApi = injectPhysicsApi({ optional: true });

		if (!physicsApi) {
			throw new Error(`[NGT Cannon] injectConstraint was called outside of <ngtc-physics>`);
		}

		const autoEffect = injectAutoEffect();

		const uuid = makeId();
		const constraintResult = {
			bodyA: injectNgtRef(bodyA),
			bodyB: injectNgtRef(bodyB),
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
						setMotorMaxForce: (value: number) => physicsApi.worker().setConstraintMotorMaxForce({ props: value, uuid }),
						setMotorSpeed: (value: number) => physicsApi.worker().setConstraintMotorSpeed({ props: value, uuid }),
					} as NgtcHingeConstraintApi;
				}
				return enableDisable as NgtcConstraintApi;
			})(),
		};

		let alreadyDisabled = false;
		afterNextRender(() => {
			autoEffect(() => {
				const worker = physicsApi.worker();
				if (!worker) return;

				const [a, b] = [constraintResult.bodyA.nativeElement, constraintResult.bodyB.nativeElement];

				if (a && b) {
					worker.addConstraint({
						props: [a.uuid, b.uuid, options],
						type,
						uuid,
					});

					if (disableOnStart && !alreadyDisabled) {
						alreadyDisabled = true;
						constraintResult.api.disable();
					}

					return () => worker.removeConstraint({ uuid });
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
