import { Injector, effect, inject, runInInjectionContext, untracked } from '@angular/core';
import { RayMode, RayOptions, RayhitEvent } from '@pmndrs/cannon-worker-api';
import { NgtAnyRecord, assertInjectionContext, makeId } from 'angular-three';
import { NGTC_PHYSICS_API } from 'angular-three-cannon';

export interface NgtcRayOptions {
    options: () => RayOptions;
    callback: (e: RayhitEvent) => void;
    injector?: Injector;
    deps?: () => NgtAnyRecord;
}

export function injectRaycastClosest(opts: NgtcRayOptions) {
    return injectRay('Closest', opts);
}

export function injectRaycastAny(opts: NgtcRayOptions) {
    return injectRay('Any', opts);
}

export function useRaycastAll(opts: NgtcRayOptions) {
    return injectRay('All', opts);
}

function injectRay(mode: RayMode, { options, callback, deps = () => ({}), injector }: NgtcRayOptions) {
    injector = assertInjectionContext(injectRay, injector);
    return runInInjectionContext(injector, () => {
        const physicsApi = inject(NGTC_PHYSICS_API);
        const { worker, events } = physicsApi();
        const uuid = makeId();

        effect((onCleanup) => {
            deps();
            events[uuid] = { rayhit: callback };
            worker().addRay({ props: { ...untracked(options), mode }, uuid });
            onCleanup(() => {
                worker().removeRay({ uuid });
                delete events[uuid];
            });
        });
    });
}
