import { DestroyRef, Injector, inject } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectStore } from '../store';
import { NgtBeforeRenderRecord } from '../types';

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
