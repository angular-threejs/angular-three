import { DestroyRef, ElementRef, Injector, Signal, computed, inject, signal, untracked } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { NgtInstanceNode, getLocalState } from './instance';
import { is } from './utils/is';

export type NgtInjectedRef<TElement> = ElementRef<TElement> & {
	/* consumers should use this for listenting to children changes on this ref */
	children: (type?: 'objects' | 'nonObjects' | 'both') => Signal<NgtInstanceNode[]>;
};

export type NgtRef<TElement> = TElement | NgtInjectedRef<TElement>;

export function injectNgtRef<TElement>(
	initial: ElementRef<TElement> | TElement = null!,
	injector?: Injector,
): NgtInjectedRef<TElement> {
	return assertInjector(injectNgtRef, injector, () => {
		const ref = is.ref(initial) ? initial : new ElementRef(initial as TElement);
		const refSignal = signal(ref.nativeElement, { equal: Object.is });
		const readonlyRef = refSignal.asReadonly();
		const computedCached = new Map();

		inject(DestroyRef).onDestroy(() => void computedCached.clear());

		const children = (type: 'objects' | 'nonObjects' | 'both' = 'objects') => {
			if (!computedCached.has(type)) {
				computedCached.set(
					type,
					computed(() => {
						const instance = readonlyRef();
						if (!instance) return [];
						const localState = getLocalState(instance);
						if (!localState?.instanceStore) return [];
						if (type === 'objects') return localState.objects();
						if (type === 'nonObjects') return localState.nonObjects();
						return [...localState.objects(), ...localState.nonObjects()];
					}),
				);
			}
			return computedCached.get(type)!;
		};

		Object.defineProperties(ref, {
			nativeElement: {
				set: (newElement) => {
					untracked(() => {
						if (newElement !== readonlyRef()) {
							refSignal.set(newElement);
						}
					});
				},
				get: readonlyRef,
			},
			children: { value: children },
		});

		return ref as NgtInjectedRef<TElement>;
	});
}
