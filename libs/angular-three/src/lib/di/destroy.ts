import { ChangeDetectorRef, inject, ViewRef } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

/**
 * A utility injection fn that can be used in other injection fn to provide the destroy capability.
 */
export function injectNgtDestroy(cb?: () => void): { destroy$: Observable<void>; cdr: ChangeDetectorRef } {
    try {
        const cdr = inject(ChangeDetectorRef);
        const destroy$ = new ReplaySubject<void>();

        queueMicrotask(() => {
            (cdr as ViewRef).onDestroy(() => {
                destroy$.next();
                destroy$.complete();
                cb?.();
            });
        });

        return { destroy$, cdr };
    } catch (e) {
        console.warn(`[NGT] injectNgtDestroy is being called outside of Constructor Context`);
        return {} as ReturnType<typeof injectNgtDestroy>;
    }
}
