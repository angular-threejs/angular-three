import {
    ChangeDetectorRef,
    DestroyRef,
    ElementRef,
    Injector,
    Signal,
    assertInInjectionContext,
    computed,
    inject,
    runInInjectionContext,
    untracked,
} from '@angular/core';
import { NgtInstanceNode } from '../types';
import { getLocalState } from '../utils/instance';
import { is } from '../utils/is';
import { safeDetectChanges } from '../utils/safe-detect-changes';
import { createSignal } from '../utils/signal';

export type NgtInjectedRef<TElement> = ElementRef<TElement> & {
    children: (type?: 'objects' | 'nonObjects' | 'both') => Signal<NgtInstanceNode[]>;
    untracked: TElement;
};

export function injectNgtRef<TElement>(
    initial: ElementRef<TElement> | TElement = null!,
    injector = inject(Injector, { optional: true })
): NgtInjectedRef<TElement> {
    !injector && assertInInjectionContext(injectNgtRef);

    return runInInjectionContext(injector!, () => {
        const cdr = inject(ChangeDetectorRef);

        const ref = is.ref(initial) ? initial : new ElementRef<TElement>(initial as TElement);
        const signalRef = createSignal(ref.nativeElement);
        const readonlySignal = signalRef.asReadonly();
        const cached = new Map();

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
                    signalRef.set(newElement);
                    safeDetectChanges(cdr);
                }
            },
            get: () => readonlySignal(),
        });

        Object.defineProperty(ref, 'untracked', {
            get: () => untracked(readonlySignal),
        });

        return Object.assign(ref, { children }) as NgtInjectedRef<TElement>;
    });
}
