import { DestroyRef, Injector, inject, runInInjectionContext } from '@angular/core';
import { injectNgtStore, type NgtBeforeRenderRecord } from './store';
import { assertInjectionContext } from './utils/assert-injection-context';

export function injectBeforeRender(
	cb: NgtBeforeRenderRecord['callback'],
	{ priority = 0, injector }: { priority?: number; injector?: Injector } = {},
) {
	injector = assertInjectionContext(injectBeforeRender, injector);
	return runInInjectionContext(injector, () => {
		const store = injectNgtStore();
		const sub = store.get('internal').subscribe(cb, priority, store);
		inject(DestroyRef).onDestroy(() => void sub());
		return sub;
	});
}
