import { DestroyRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { NgtBeforeRenderRecord, injectStore } from '../store';

export function injectBeforeRender(
	cb: NgtBeforeRenderRecord['callback'],
	{ priority = 0, injector }: { priority?: number; injector?: Injector } = {},
) {
	return assertInjector(injectBeforeRender, injector, () => {
		const store = injectStore();
		const sub = store.get('internal').subscribe(cb, priority, store);
		inject(DestroyRef).onDestroy(() => void sub());
		return sub;
	});
}

// TODO (chau): clean this up
export function injectNextBeforeRender(
	cb: NgtBeforeRenderRecord['callback'],
	{ priority = 0, injector }: { priority?: number; injector?: Injector } = {},
) {
	return assertInjector(injectNextBeforeRender, injector, () => {
		const assertedInjector = inject(Injector);
		const sub = signal<ReturnType<typeof injectBeforeRender> | null>(null);

		afterNextRender(() => {
			sub.set(injectBeforeRender(cb, { priority, injector: assertedInjector }));
		});

		return sub.asReadonly();
	});
}
