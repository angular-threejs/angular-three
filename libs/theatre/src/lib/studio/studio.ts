import { booleanAttribute, Directive, effect, input, signal } from '@angular/core';
import { type IStudio } from '@theatre/studio';
import { THEATRE_STUDIO } from './studio-token';

/**
 * Directive that initializes and manages the Theatre.js Studio.
 *
 * Theatre.js Studio is a visual editor that allows you to create and edit
 * animations directly in the browser. The studio UI is dynamically imported
 * to avoid including it in production builds.
 *
 * This directive must be applied to a `theatre-project` element and provides
 * the studio instance via the `THEATRE_STUDIO` injection token.
 *
 * @example
 * ```html
 * <!-- Enable studio (default) -->
 * <theatre-project studio>
 *   <ng-container sheet="scene">...</ng-container>
 * </theatre-project>
 *
 * <!-- Conditionally enable/disable studio -->
 * <theatre-project [studio]="isDevelopment">
 *   <ng-container sheet="scene">...</ng-container>
 * </theatre-project>
 *
 * <!-- Disable studio -->
 * <theatre-project [studio]="false">
 *   <ng-container sheet="scene">...</ng-container>
 * </theatre-project>
 * ```
 */
@Directive({
	selector: 'theatre-project[studio]',
	exportAs: 'studio',
	providers: [
		{ provide: THEATRE_STUDIO, useFactory: (studio: TheatreStudio) => studio.studio, deps: [TheatreStudio] },
	],
})
export class TheatreStudio {
	/**
	 * Whether the studio UI should be visible.
	 * When false, the studio UI is hidden but the studio instance remains active.
	 *
	 * @default true
	 */
	enabled = input(true, { alias: 'studio', transform: booleanAttribute });

	private Studio = signal<IStudio | null>(null);

	/**
	 * Read-only signal containing the Theatre.js Studio instance.
	 * May be null while the studio is being loaded.
	 */
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
