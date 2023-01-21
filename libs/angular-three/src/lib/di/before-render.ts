import { inject } from '@angular/core';
import { NgtStore } from '../stores/store';
import { NgtBeforeRenderRecord } from '../types';
import { injectNgtDestroy } from './destroy';

export function injectBeforeRender(cb: NgtBeforeRenderRecord['callback'], priority = 0) {
    try {
        const store = inject(NgtStore);
        const sub = store.get('internal').subscribe((state) => cb(state), priority, store);
        injectNgtDestroy(() => void sub());
        return sub;
    } catch (e) {
        throw new Error(`[NGT] "injectBeforeRender" is invoked outside of Constructor Context`);
    }
}
