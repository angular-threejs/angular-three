import { DestroyRef, Injector, inject } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectStore } from '../store';
import type { NgtBeforeRenderRecord } from '../types';

/**
 * `injectBeforeRender` invokes its callback on every frame. Hence, the notion of tracking
 * changes (i.e: signals) does not really matter since we're getting latest values of the things we need on every frame anyway.
 *
 * If `priority` is dynamic, consumers should set up `injectBeforeRender` in
 * an `effect` and track `priority` changes. Make use of `onCleanup` to clean up
 * previous before render subscription
 *
 * @example
 * ```ts
 * const injector = inject(Injector);
 *
 * effect((onCleanup) => {
 *   const priority = this.priority(); // track priority
 *
 *   const sub = injectBeforeRender(
 *    ({ gl, camera }) => {
 *      // before render logic
 *    },
 *    {
 *      priority,
 *      injector, // injector is needed since injectBeforeRender is invoked in effect body
 *    }
 *   });
 *
 *   onCleanup(() => sub());
 * });
 * ```
 */
export function injectBeforeRender(
	cb: NgtBeforeRenderRecord['callback'],
	{ priority = 0, injector }: { priority?: number; injector?: Injector } = {},
) {
	return assertInjector(injectBeforeRender, injector, () => {
		const store = injectStore();
		const sub = store.snapshot.internal.subscribe(cb, priority, store);
		inject(DestroyRef).onDestroy(() => void sub());
		return sub;
	});
}
