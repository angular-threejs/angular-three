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
import { getLocalState, type NgtInstanceNode } from './instance';
import { assertInjector } from './utils/assert-injector';
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
	injector = assertInjector(injectNgtRef);
	const ref = is.ref(initial) ? initial : new ElementRef(initial as TElement);
	const signalRef = signal(ref.nativeElement);
	const readonlySignal = signalRef.asReadonly();
	const cached = new Map();

	return runInInjectionContext(injector, () => {
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
					}),
				);
			}
			return cached.get(type)!;
		};

		Object.defineProperties(ref, {
			nativeElement: {
				set: (newElement) => {
					untracked(() => {
						if (newElement !== signalRef()) {
							signalRef.set(newElement);
						}
					});
				},
				get: readonlySignal,
			},
			untracked: { get: () => untracked(readonlySignal) },
			children: { get: () => children },
		});

		return ref as NgtInjectedRef<TElement>;
	});
}
