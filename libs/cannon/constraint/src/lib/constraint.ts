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
		bodyA: ElementRef<A> | A | Signal<ElementRef<A> | A | undefined>,
		bodyB: ElementRef<B> | B | Signal<ElementRef<B> | B | undefined>,
		options?: NgtcConstraintOptions<TConstraint>,
	) => injectConstraint<TConstraint, A, B>(type, bodyA, bodyB, options);
}

function injectConstraint<
	TConstraint extends ConstraintTypes | 'Hinge',
	A extends Object3D = Object3D,
	B extends Object3D = Object3D,
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
	return assertInjector(injectConstraint, injector, () => {
		const physics = inject(NgtcPhysics, { optional: true });

		if (!physics) {
			throw new Error(`[NGT Cannon] injectConstraint was called outside of <ngtc-physics>`);
		}

		const worker = physics.api.worker;

		const uuid = makeId();
		const bodyARef = isSignal(bodyA) ? bodyA : signal(bodyA);
		const bodyBRef = isSignal(bodyB) ? bodyB : signal(bodyB);
		const bodyAValue = computed(() => resolveRef(bodyARef()));
		const bodyBValue = computed(() => resolveRef(bodyBRef()));

		const api = computed(() => {
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

			const [a, b] = [bodyAValue(), bodyBValue()];
			if (!a || !b) return;

			currentWorker.addConstraint({
				props: [a.uuid, b.uuid, options],
				type,
				uuid,
			});

			if (disableOnStart && !alreadyDisabled) {
				alreadyDisabled = true;
				untracked(api)?.disable();
			}

			onCleanup(() => currentWorker.removeConstraint({ uuid }));
		});

		return api;
	});
}

export const injectPointToPoint = createInjectConstraint('PointToPoint');
export const injectConeTwist = createInjectConstraint('ConeTwist');
export const injectDistance = createInjectConstraint('Distance');
export const injectLock = createInjectConstraint('Lock');
export const injectHinge = createInjectConstraint('Hinge');
