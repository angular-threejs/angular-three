import { Injector, Signal, computed, effect, inject, runInInjectionContext, untracked } from '@angular/core';
import { SpringOptns } from '@pmndrs/cannon-worker-api';
import { NgtAnyRecord, NgtInjectedRef, assertInjectionContext, injectNgtRef, is, makeId } from 'angular-three';
import { NGTC_PHYSICS_API } from 'angular-three-cannon';

export interface NgtcSpringApi {
    setDamping: (value: number) => void;
    setRestLength: (value: number) => void;
    setStiffness: (value: number) => void;
    remove: () => void;
}

export interface NgtcSpringReturn<
    TObjectA extends THREE.Object3D = THREE.Object3D,
    TObjectB extends THREE.Object3D = THREE.Object3D
> {
    bodyA: NgtInjectedRef<TObjectA>;
    bodyB: NgtInjectedRef<TObjectB>;
    api: Signal<NgtcSpringApi>;
}

export function injectSpring<A extends THREE.Object3D, B extends THREE.Object3D>(
    bodyA: NgtInjectedRef<A> | A,
    bodyB: NgtInjectedRef<B> | B,
    {
        injector,
        opts = () => ({}),
        deps = () => ({}),
    }: { injector?: Injector; deps?: () => NgtAnyRecord; opts?: () => SpringOptns } = {}
): NgtcSpringReturn<A, B> {
    injector = assertInjectionContext(injectSpring, injector);
    return runInInjectionContext(injector, () => {
        const physicsApi = inject(NGTC_PHYSICS_API);
        const { worker } = physicsApi();

        const uuid = makeId();

        const bodyARef = is.ref(bodyA) ? bodyA : injectNgtRef(bodyA);
        const bodyBRef = is.ref(bodyB) ? bodyB : injectNgtRef(bodyB);

        effect((onCleanup) => {
            deps();
            if (bodyARef.nativeElement && bodyBRef.nativeElement) {
                worker().addSpring({
                    props: [bodyARef.nativeElement.uuid, bodyBRef.nativeElement.uuid, untracked(opts)],
                    uuid,
                });
                onCleanup(() => worker().removeSpring({ uuid }));
            }
        });

        const api = computed(() => {
            deps();
            return {
                setDamping: (value: number) => worker().setSpringDamping({ props: value, uuid }),
                setRestLength: (value: number) => worker().setSpringRestLength({ props: value, uuid }),
                setStiffness: (value: number) => worker().setSpringStiffness({ props: value, uuid }),
                remove: () => worker().removeSpring({ uuid }),
            };
        });

        return { bodyA: bodyARef, bodyB: bodyBRef, api };
    });
}
