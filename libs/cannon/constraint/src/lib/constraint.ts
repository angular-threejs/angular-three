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

export const pointToPoint = createConstraint('PointToPoint');
export const coneTwist = createConstraint('ConeTwist');
export const distance = createConstraint('Distance');
export const lock = createConstraint('Lock');
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
