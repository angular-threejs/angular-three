import { ChangeDetectorRef, inject, signal, type CreateSignalOptions, type Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';

// TODO: use scheduler instead of force CD
export function cdAwareSignal<T>(
	initialValue: T,
	{ injector, ...options }: CreateSignalOptions<T> & { injector?: Injector } = {},
) {
	return assertInjector(cdAwareSignal, injector, () => {
		if (!options.equal) {
			options.equal = Object.is;
		}

		const cdr = inject(ChangeDetectorRef);

		const source = signal(initialValue, options);
		const originalSet = source.set.bind(source);
		const originalUpdate = source.update.bind(source);

		source.set = (...args: Parameters<(typeof source)['set']>) => {
			originalSet(...args);
			cdr.detectChanges();
		};

		source.update = (...args: Parameters<(typeof source)['update']>) => {
			originalUpdate(...args);
			cdr.detectChanges();
		};

		return source;
	});
}
