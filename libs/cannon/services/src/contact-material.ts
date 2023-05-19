import { Injector, effect, inject, runInInjectionContext, untracked } from '@angular/core';
import { ContactMaterialOptions, MaterialOptions } from '@pmndrs/cannon-worker-api';
import { NgtAnyRecord, assertInjectionContext, makeId } from 'angular-three';
import { NGTC_PHYSICS_API } from 'angular-three-cannon';

export function injectContactMaterial(
    materialB: MaterialOptions,
    materialA: MaterialOptions,
    {
        opts,
        deps = () => ({}),
        injector,
    }: { opts: () => ContactMaterialOptions; deps?: () => NgtAnyRecord; injector?: Injector }
): void {
    injector = assertInjectionContext(injectContactMaterial, injector);
    return runInInjectionContext(injector, () => {
        const physicsApi = inject(NGTC_PHYSICS_API);
        const { worker } = physicsApi();
        const uuid = makeId();
        effect((onCleanup) => {
            deps();
            worker.addContactMaterial({
                props: [materialA, materialB, untracked(opts)],
                uuid,
            });
            onCleanup(() => worker.removeContactMaterial({ uuid }));
        });
    });
}
