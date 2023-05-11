import { DestroyRef, Injector, assertInInjectionContext, inject, runInInjectionContext } from '@angular/core';
import { NgtStore } from '../stores/store';
import { NgtBeforeRenderRecord } from '../types';

export function injectBeforeRender(
    cb: NgtBeforeRenderRecord['callback'],
    { priority = 0, injector }: { priority?: number; injector?: Injector | null } = {}
) {
    assertInInjectionContext(injectBeforeRender);

    if (!injector) {
        injector = inject(Injector);
    }

    return runInInjectionContext(injector, () => {
        const store = inject(NgtStore);
        const sub = store.get('internal').subscribe(cb, priority, store);
        inject(DestroyRef).onDestroy(() => void sub());
        return sub;
    });
}
