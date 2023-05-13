import { DestroyRef, Injector, inject, runInInjectionContext } from '@angular/core';
import { NgtStore } from '../stores/store';
import { NgtBeforeRenderRecord } from '../types';
import { assertInjectionContext } from '../utils/assert-in-injection-context';

export function injectBeforeRender(
    cb: NgtBeforeRenderRecord['callback'],
    { priority = 0, injector }: { priority?: number; injector?: Injector } = {}
) {
    injector = assertInjectionContext(injectBeforeRender, injector);
    return runInInjectionContext(injector, () => {
        const store = inject(NgtStore);
        const sub = store.get('internal').subscribe(cb, priority, store);
        inject(DestroyRef).onDestroy(() => void sub());
        return sub;
    });
}
