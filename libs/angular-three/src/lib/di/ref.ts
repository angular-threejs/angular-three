import { ChangeDetectorRef, ElementRef, ViewRef } from '@angular/core';
import {
    BehaviorSubject,
    distinctUntilChanged,
    filter,
    map,
    merge,
    Observable,
    of,
    Subscription,
    switchMap,
    takeUntil,
} from 'rxjs';
import type { NgtInstanceNode } from '../types';
import { getLocalState } from '../utils/instance';
import { is } from '../utils/is';
import { safeDetectChanges } from '../utils/safe-detect-changes';
import { injectNgtDestroy } from './destroy';

type Subscribe<T> = (callback: (current: T, previous: T | null) => void) => Subscription;

export type NgtInjectedRef<T> = ElementRef<T> & {
    /* a Subscribe fn that emits current and previous value. Useful for debug */
    subscribe: Subscribe<T>;
    /* consumers should use this for listening to value of this ref. This filters out initial null value */
    $: Observable<T>;
    /* consumers should use this for listenting to children changes on this ref */
    children$: (type?: 'objects' | 'nonObjects' | 'both') => Observable<NgtInstanceNode[]>;
    /* notify this CD when ref value changes */
    useCDR: (cdr: ChangeDetectorRef) => void;
};

export function injectNgtRef<T>(initialValue: NgtInjectedRef<T> | (T | null) = null): NgtInjectedRef<T> {
    const ref = is.ref(initialValue) ? initialValue : new ElementRef<T>(initialValue as T);

    let lastValue = ref.nativeElement;

    const cdRefs = [] as ChangeDetectorRef[];
    const ref$ = new BehaviorSubject<T>(lastValue);

    const { destroy$, cdr } = injectNgtDestroy(() => {
        ref$.complete();
    });

    cdRefs.push(cdr);

    const obs$ = ref$.asObservable().pipe(distinctUntilChanged(), takeUntil(destroy$));

    const subscribe: Subscribe<T> = (callback) => {
        return obs$.subscribe((current) => {
            callback(current, lastValue);
            lastValue = current;
        });
    };

    const $ = obs$.pipe(
        filter((value, index) => index > 0 || value != null),
        takeUntil(destroy$)
    );

    const children$ = (type: 'objects' | 'nonObjects' | 'both' = 'objects') =>
        $.pipe(
            switchMap((instance) => {
                const localState = getLocalState(instance as NgtInstanceNode);
                if (localState.objects && localState.nonObjects) {
                    return merge(localState.objects, localState.nonObjects).pipe(
                        map(() => {
                            try {
                                return type === 'both'
                                    ? [...localState.objects.value, ...localState.nonObjects.value]
                                    : localState[type].value;
                            } catch (e) {
                                console.error(`[NGT] Exception in accessing children of ${instance}`);
                                return [];
                            }
                        })
                    );
                }

                return of([]);
            }),
            filter((children, index) => index > 0 || children.length > 0),
            takeUntil(destroy$)
        );

    Object.defineProperty(ref, 'nativeElement', {
        set: (newVal: T) => {
            if (ref.nativeElement !== newVal) {
                ref$.next(newVal);

                lastValue = ref.nativeElement;
                ref.nativeElement = newVal;

                // clone the cdRefs so we can mutate cdRefs in the loop
                const cds = [...cdRefs];
                for (let i = 0; i < cds.length; i++) {
                    const cd = cds[i];
                    // if a ChangeDetectorRef is destroyed, we stop tracking it and go to the next one
                    if ((cd as ViewRef).destroyed) {
                        cdRefs.splice(i, 1);
                        continue;
                    }
                    // during creation phase, 'context' on ViewRef will be null
                    // we check the "context" to avoid running detectChanges during this phase.
                    // because there's nothing to check
                    safeDetectChanges(cd);
                }
            }
        },
        get: () => ref$.value,
    });

    return Object.assign(ref, { subscribe, $, children$, useCDR: (cdr: ChangeDetectorRef) => void cdRefs.push(cdr) });
}
