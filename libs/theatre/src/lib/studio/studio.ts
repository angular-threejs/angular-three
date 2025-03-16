import { booleanAttribute, Directive, effect, input, signal } from '@angular/core';
import { type IStudio } from '@theatre/studio';
import { THEATRE_STUDIO } from './studio-token';

@Directive({
	selector: 'theatre-project[studio]',
	exportAs: 'studio',
	providers: [
		{ provide: THEATRE_STUDIO, useFactory: (studio: TheatreStudio) => studio.studio, deps: [TheatreStudio] },
	],
})
export class TheatreStudio {
	enabled = input(true, { alias: 'studio', transform: booleanAttribute });

	private Studio = signal<IStudio | null>(null);
	studio = this.Studio.asReadonly();

	constructor() {
		import('@theatre/studio').then((m) => {
			const Studio = 'default' in m.default ? (m.default as unknown as { default: IStudio }).default : m.default;
			Studio.initialize();
			this.Studio.set(Studio);
		});

		effect((onCleanup) => {
			const studio = this.Studio();
			if (!studio) return;

			const enabled = this.enabled();

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
