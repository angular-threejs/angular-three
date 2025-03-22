import { DestroyRef, effect, inject, Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectStore } from '../store';
import type { NgtBeforeRenderRecord } from '../types';

/**
 * `injectBeforeRender` invokes its callback on every frame. Hence, the notion of tracking
 * changes (i.e: signals) does not really matter since we're getting latest values of the things we need on every frame anyway.
 *
 * If `priority` is a Signal, `injectBeforeRender` will set up an Effect internally and returns the `EffectRef#destroy` instead.
 *
 * @example
 * ```ts
 * const destroy = injectBeforeRender(
 *  ({ gl, camera }) => {
 *    // before render logic
 *  },
 *  {
 *    priority: this.priority, // this.priority is a Signal<number>
 *  }
 * )
 * ```
 */
export function beforeRender(
	cb: NgtBeforeRenderRecord['callback'],
	{ priority = 0, injector }: { priority?: number | (() => number); injector?: Injector } = {},
) {
	if (typeof priority === 'function') {
		const effectRef = assertInjector(beforeRender, injector, () => {
			const store = injectStore();
			const ref = effect((onCleanup) => {
				const p = priority();
				const sub = store.snapshot.internal.subscribe(cb, p, store);
				onCleanup(() => sub());
			});

			inject(DestroyRef).onDestroy(() => void ref.destroy());

			return ref;
		});

		return effectRef.destroy.bind(effectRef);
	}

	return assertInjector(beforeRender, injector, () => {
		const store = injectStore();
		const sub = store.snapshot.internal.subscribe(cb, priority, store);
		inject(DestroyRef).onDestroy(() => void sub());
		return sub;
	});
}

/**
 * @deprecated Use `beforeRender` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectBeforeRender = beforeRender;
