import { Directive, effect } from '@angular/core';
import { injectNgtStore } from 'angular-three';

@Directive({ selector: 'ngts-adaptive-events', standalone: true })
export class NgtsAdaptiveEvents {
	private store = injectNgtStore();
	private setEvents = this.store.get('setEvents');
	private current = this.store.select('performance', 'current');

	constructor() {
		effect((onCleanup) => {
			const enabled = this.store.get('events', 'enabled');
			onCleanup(() => {
				this.setEvents({ enabled });
			});
		});

		effect(() => {
			const current = this.current();
			this.setEvents({ enabled: current === 1 });
		});
	}
}
