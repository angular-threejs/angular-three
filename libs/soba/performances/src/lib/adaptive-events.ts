import { DestroyRef, Directive, effect, inject } from '@angular/core';
import { injectStore } from 'angular-three';

/**
 * A directive that dynamically toggles event handling based on performance metrics.
 *
 * When performance drops (current < 1), this directive disables event handling to reduce
 * computational overhead. Events are re-enabled when performance recovers or when the
 * directive is destroyed.
 *
 * This is useful for maintaining smooth rendering during heavy computation by temporarily
 * sacrificing interactivity.
 *
 * @example
 * ```html
 * <ngts-adaptive-events />
 * ```
 */
@Directive({ selector: 'ngts-adaptive-events' })
export class NgtsAdaptiveEvents {
	constructor() {
		const store = injectStore();
		const currentEnabled = store.snapshot.events.enabled;

		effect((onCleanup) => {
			const current = store.performance.current();
			onCleanup(() => store.snapshot.setEvents({ enabled: current === 1 }));
		});

		inject(DestroyRef).onDestroy(() => {
			store.snapshot.setEvents({ enabled: currentEnabled });
		});
	}
}
