import { effect, runInInjectionContext, untracked, type Injector } from '@angular/core';
import type { SpringOptns } from '@pmndrs/cannon-worker-api';
import { assertInjector, injectNgtRef, is, makeId, type NgtAnyRecord, type NgtInjectedRef } from 'angular-three';
import { injectNgtcPhysicsApi } from 'angular-three-cannon';

export type NgtcSpringApi = {
	setDamping: (value: number) => void;
	setRestLength: (value: number) => void;
	setStiffness: (value: number) => void;
	remove: () => void;
};

export type NgtcSpringReturn<
	TObjectA extends THREE.Object3D = THREE.Object3D,
	TObjectB extends THREE.Object3D = THREE.Object3D,
> = {
	bodyA: NgtInjectedRef<TObjectA>;
	bodyB: NgtInjectedRef<TObjectB>;
	api: NgtcSpringApi;
};

export function injectSpring<A extends THREE.Object3D, B extends THREE.Object3D>(
	bodyA: NgtInjectedRef<A> | A,
	bodyB: NgtInjectedRef<B> | B,
	{
		injector,
		opts = () => ({}),
		deps = () => ({}),
	}: { injector?: Injector; deps?: () => NgtAnyRecord; opts?: () => SpringOptns } = {},
): NgtcSpringReturn<A, B> {
	injector = assertInjector(injectSpring, injector);
	return runInInjectionContext(injector, () => {
		const physicsApi = injectNgtcPhysicsApi();
		const worker = physicsApi.select('worker');

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

		const api = (() => ({
			setDamping: (value: number) => worker().setSpringDamping({ props: value, uuid }),
			setRestLength: (value: number) => worker().setSpringRestLength({ props: value, uuid }),
			setStiffness: (value: number) => worker().setSpringStiffness({ props: value, uuid }),
			remove: () => worker().removeSpring({ uuid }),
		}))();

		return { bodyA: bodyARef, bodyB: bodyBRef, api };
	});
}
