import { afterNextRender, Directive } from '@angular/core';
import { injectStore } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';

@Directive({ standalone: true, selector: 'ngts-adaptive-events' })
export class NgtsAdaptiveEvents {
	constructor() {
		const autoEffect = injectAutoEffect();
		const store = injectStore();
		const current = store.select('performance', 'current');

		afterNextRender(() => {
			autoEffect(() => {
				const enabled = store.snapshot.events.enabled;
				return () => store.snapshot.setEvents({ enabled });
			});

			autoEffect(() => {
				const _current = current();
				return () => store.snapshot.setEvents({ enabled: _current === 1 });
			});
		});
	}
}
