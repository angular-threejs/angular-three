import { effect, runInInjectionContext, untracked, type Injector } from '@angular/core';
import type { ContactMaterialOptions, MaterialOptions } from '@pmndrs/cannon-worker-api';
import { assertInjector, makeId, type NgtAnyRecord } from 'angular-three';
import { injectNgtcPhysicsApi } from 'angular-three-cannon';

export function injectContactMaterial(
	materialB: MaterialOptions,
	materialA: MaterialOptions,
	{
		opts,
		deps = () => ({}),
		injector,
	}: { opts: () => ContactMaterialOptions; deps?: () => NgtAnyRecord; injector?: Injector },
): void {
	injector = assertInjector(injectContactMaterial, injector);
	return runInInjectionContext(injector, () => {
		const physicsApi = injectNgtcPhysicsApi();
		const worker = physicsApi.select('worker');
		const uuid = makeId();
		effect((onCleanup) => {
			deps();
			worker().addContactMaterial({
				props: [materialA, materialB, untracked(opts)],
				uuid,
			});
			onCleanup(() => worker().removeContactMaterial({ uuid }));
		});
	});
}
