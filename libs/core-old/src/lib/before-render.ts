import { DestroyRef, Injector, inject } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectNgtStore, type NgtBeforeRenderRecord } from './store';

export function injectBeforeRender(
	cb: NgtBeforeRenderRecord['callback'],
	{ priority = 0, injector }: { priority?: number; injector?: Injector } = {},
) {
	return assertInjector(injectBeforeRender, injector, () => {
		const store = injectNgtStore();
		const sub = store.get('internal').subscribe(cb, priority, store);
		inject(DestroyRef).onDestroy(() => void sub());
		return sub;
	});
}
