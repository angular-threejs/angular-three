import { DestroyRef, Directive, effect, inject } from '@angular/core';
import { injectStore } from 'angular-three';

@Directive({ standalone: true, selector: 'ngts-adaptive-events' })
export class NgtsAdaptiveEvents {
	constructor() {
		const store = injectStore();
		const current = store.select('performance', 'current');
		const currentEnabled = store.snapshot.events.enabled;

		effect((onCleanup) => {
			const _current = current();
			onCleanup(() => store.snapshot.setEvents({ enabled: _current === 1 }));
		});

		inject(DestroyRef).onDestroy(() => {
			store.snapshot.setEvents({ enabled: currentEnabled });
		});
	}
}
