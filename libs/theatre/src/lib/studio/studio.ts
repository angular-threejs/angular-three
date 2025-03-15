import { booleanAttribute, Directive, effect, input, signal } from '@angular/core';
import Studio from '@theatre/studio';
import { THEATRE_STUDIO } from './studio-token';

@Directive({
	selector: 'theatre-project[studio]',
	providers: [
		{ provide: THEATRE_STUDIO, useFactory: (studio: TheatreStudio) => studio.studio, deps: [TheatreStudio] },
	],
})
export class TheatreStudio {
	enabled = input(true, { alias: 'studio', transform: booleanAttribute });

	private Studio = signal(Studio);
	studio = this.Studio.asReadonly();

	constructor() {
		Studio.initialize();

		effect((onCleanup) => {
			const [enabled, studio] = [this.enabled(), this.Studio()];
			if (enabled) {
				studio.ui.restore();
			} else {
				studio.ui.hide();
			}

			onCleanup(() => {
				studio.ui.hide();
			});
		});
	}
}
