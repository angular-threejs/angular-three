import { Injector, Signal, computed, effect, inject, runInInjectionContext, untracked } from '@angular/core';
import {
    ConstraintOptns,
    ConstraintTypes,
    HingeConstraintOpts,
    PointToPointConstraintOpts,
} from '@pmndrs/cannon-worker-api';
import { NgtAnyRecord, NgtInjectedRef, assertInjectionContext, injectNgtRef, is, makeId } from 'angular-three';
import { NGTC_PHYSICS_API } from 'angular-three-cannon';
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

export interface NgtcConstraintReturn<
    T extends 'Hinge' | ConstraintTypes,
    TObjectA extends THREE.Object3D = THREE.Object3D,
    TObjectB extends THREE.Object3D = THREE.Object3D
> {
    bodyA: NgtInjectedRef<TObjectA>;
    bodyB: NgtInjectedRef<TObjectB>;
    api: Signal<NgtcConstraintORHingeApi<T>>;
}

export interface NgtcConstraintOptions<
    TConstraintType extends 'Hinge' | ConstraintTypes,
    TOptions extends HingeConstraintOpts | ConstraintOptns = TConstraintType extends 'Hinge'
        ? HingeConstraintOpts
        : ConstraintOptns
> {
    injector?: Injector;
    deps?: () => NgtAnyRecord;
    opts?: () => TOptions;
}

export function usePointToPointConstraint<A extends THREE.Object3D, B extends THREE.Object3D>(
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    opts?: NgtcConstraintOptions<'PointToPoint', PointToPointConstraintOpts>
) {
    return injectConstraint('PointToPoint', bodyA, bodyB, opts);
}
export function useConeTwistConstraint<A extends THREE.Object3D, B extends THREE.Object3D>(
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    opts?: NgtcConstraintOptions<'ConeTwist', PointToPointConstraintOpts>
) {
    return injectConstraint('ConeTwist', bodyA, bodyB, opts);
}
export function useDistanceConstraint<A extends THREE.Object3D, B extends THREE.Object3D>(
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    opts?: NgtcConstraintOptions<'Distance', PointToPointConstraintOpts>
) {
    return injectConstraint('Distance', bodyA, bodyB, opts);
}
export function useHingeConstraint<A extends THREE.Object3D, B extends THREE.Object3D>(
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    opts?: NgtcConstraintOptions<'Hinge', PointToPointConstraintOpts>
) {
    return injectConstraint('Hinge', bodyA, bodyB, opts);
}
export function useLockConstraint<A extends THREE.Object3D, B extends THREE.Object3D>(
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    opts?: NgtcConstraintOptions<'Lock', PointToPointConstraintOpts>
) {
    return injectConstraint('Lock', bodyA, bodyB, opts);
}

function injectConstraint<
    TConstraintType extends 'Hinge' | ConstraintTypes,
    A extends THREE.Object3D,
    B extends THREE.Object3D,
    TOptions extends HingeConstraintOpts | ConstraintOptns = TConstraintType extends 'Hinge'
        ? HingeConstraintOpts
        : ConstraintOptns
>(
    type: TConstraintType,
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    {
        injector,
        deps = () => ({}),
        opts = () => ({} as TOptions),
    }: NgtcConstraintOptions<TConstraintType, TOptions> = {}
): NgtcConstraintReturn<TConstraintType, A, B> {
    injector = assertInjectionContext(injectConstraint, injector);
    return runInInjectionContext(injector, () => {
        const physicsApi = inject(NGTC_PHYSICS_API);
        const { worker } = physicsApi();

        const uuid = makeId();

        const bodyARef = is.ref(bodyA) ? bodyA : injectNgtRef(bodyA);
        const bodyBRef = is.ref(bodyB) ? bodyB : injectNgtRef(bodyB);

        effect((onCleanup) => {
            deps();
            if (bodyARef.nativeElement && bodyBRef.nativeElement) {
                worker.addConstraint({
                    props: [bodyARef.untracked.uuid, bodyBRef.untracked.uuid, untracked(opts)],
                    type,
                    uuid,
                });
                onCleanup(() => worker.removeConstraint({ uuid }));
            }
        });

        const api = computed(() => {
            deps();
            const enableDisable = {
                disable: () => worker.disableConstraint({ uuid }),
                enable: () => worker.enableConstraint({ uuid }),
                remove: () => worker.removeConstraint({ uuid }),
            };

            if (type === 'Hinge') {
                return {
                    ...enableDisable,
                    disableMotor: () => worker.disableConstraintMotor({ uuid }),
                    enableMotor: () => worker.enableConstraintMotor({ uuid }),
                    setMotorMaxForce: (value: number) => worker.setConstraintMotorMaxForce({ props: value, uuid }),
                    setMotorSpeed: (value: number) => worker.setConstraintMotorSpeed({ props: value, uuid }),
                } as NgtcConstraintORHingeApi<TConstraintType>;
            }

            return enableDisable as NgtcConstraintORHingeApi<TConstraintType>;
        });

        return { bodyA: bodyARef, bodyB: bodyBRef, api };
    });
}
