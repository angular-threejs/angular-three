import { DestroyRef, Directive, effect, inject } from '@angular/core';
import { injectStore } from 'angular-three';

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
