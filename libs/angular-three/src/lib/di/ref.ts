import {
    ChangeDetectorRef,
    DestroyRef,
    ElementRef,
    Injector,
    Signal,
    computed,
    inject,
    runInInjectionContext,
    signal,
    untracked,
} from '@angular/core';
import { NgtInstanceNode } from '../types';
import { assertInjectionContext } from '../utils/assert-in-injection-context';
import { getLocalState } from '../utils/instance';
import { is } from '../utils/is';
import { safeDetectChanges } from '../utils/safe-detect-changes';

export type NgtInjectedRef<TElement> = ElementRef<TElement> & {
    /* consumers should use this for listenting to children changes on this ref */
    children: (type?: 'objects' | 'nonObjects' | 'both') => Signal<NgtInstanceNode[]>;
    /* consumers should use this to read the ref current value without registering the signal */
    untracked: TElement;
};

export function injectNgtRef<TElement>(
    initial: ElementRef<TElement> | TElement = null!,
    injector?: Injector
): NgtInjectedRef<TElement> {
    injector = assertInjectionContext(injectNgtRef, injector);
    const ref = is.ref(initial) ? initial : new ElementRef<TElement>(initial as TElement);
    const signalRef = signal(ref.nativeElement);
    const readonlySignal = signalRef.asReadonly();
    const cached = new Map();
    return runInInjectionContext(injector, () => {
        const cdr = inject(ChangeDetectorRef);

        inject(DestroyRef).onDestroy(() => void cached.clear());

        const children = (type: 'objects' | 'nonObjects' | 'both' = 'objects') => {
            if (!cached.has(type)) {
                cached.set(
                    type,
                    computed(() => {
                        const instance = readonlySignal();
                        if (!instance) return [];
                        const localState = getLocalState(instance);
                        if (!localState.objects || !localState.nonObjects) return [];
                        if (type === 'objects') return localState.objects();
                        if (type === 'nonObjects') return localState.nonObjects();
                        return [...localState.objects(), ...localState.nonObjects()];
                    })
                );
            }
            return cached.get(type)!;
        };

        Object.defineProperty(ref, 'nativeElement', {
            set: (newElement) => {
                if (newElement !== untracked(signalRef)) {
                    try {
                        signalRef.set(newElement);
                    } catch {
                        requestAnimationFrame(() => {
                            signalRef.set(newElement);
                        });
                    }
                    requestAnimationFrame(() => void safeDetectChanges(cdr));
                    // trigger CDR
                }
            },
            get: () => readonlySignal(),
        });

        Object.defineProperty(ref, 'untracked', { get: () => untracked(readonlySignal) });

        return Object.assign(ref, { children }) as NgtInjectedRef<TElement>;
    });
}
