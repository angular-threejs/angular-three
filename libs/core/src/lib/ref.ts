import {
	DestroyRef,
	ElementRef,
	computed,
	inject,
	runInInjectionContext,
	signal,
	untracked,
	type Injector,
	type Signal,
} from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { getLocalState, type NgtInstanceNode } from './instance';
import { is } from './utils/is';

export type NgtInjectedRef<TElement> = ElementRef<TElement> & {
	/* consumers should use this for listenting to children changes on this ref */
	children: (type?: 'objects' | 'nonObjects' | 'both') => Signal<NgtInstanceNode[]>;
	/* consumers should use this to read the ref current value without registering the signal */
	untracked: TElement;
};

export type NgtRef<TElement> = TElement | NgtInjectedRef<TElement>;

export function injectNgtRef<TElement>(
	initial: ElementRef<TElement> | TElement = null!,
	injector?: Injector,
): NgtInjectedRef<TElement> {
	injector = assertInjector(injectNgtRef, injector);
	const ref = is.ref(initial) ? initial : new ElementRef(initial as TElement);
	const refSignal = signal(ref.nativeElement);
	const readonlyRef = refSignal.asReadonly();
	const computedCached = new Map();

	return runInInjectionContext(injector, () => {
		inject(DestroyRef).onDestroy(() => void computedCached.clear());

		const children = (type: 'objects' | 'nonObjects' | 'both' = 'objects') => {
			if (!computedCached.has(type)) {
				computedCached.set(
					type,
					computed(() => {
						const instance = readonlyRef();
						if (!instance) return [];
						const localState = getLocalState(instance);
						if (!localState.objects || !localState.nonObjects) return [];
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
						if (newElement !== refSignal()) {
							refSignal.set(newElement);
						}
					});
				},
				get: readonlyRef,
			},
			untracked: { get: () => untracked(readonlyRef) },
			children: { get: () => children },
		});

		return ref as NgtInjectedRef<TElement>;
	});
}
