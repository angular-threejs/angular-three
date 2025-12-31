import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { beforeRender, injectStore, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { Sparkles, type SparklesProps } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';

/**
 * Configuration options for the NgtsSparkles component.
 * Combines Three.js points element options with sparkle-specific properties.
 */
export type NgtsSparklesOptions = Partial<NgtThreeElements['ngt-points']> & SparklesProps;

/**
 * Default options for the sparkles effect.
 * @default { count: 100, speed: 1, opacity: 1, scale: 1, noise: 1 }
 */
const defaultSparklesOptions: NgtsSparklesOptions = {
	count: 100,
	speed: 1,
	opacity: 1,
	scale: 1,
	noise: 1,
};

/**
 * Renders animated sparkle particles floating in 3D space.
 * Creates a magical, sparkling effect using GPU-accelerated points.
 *
 * @example
 * ```html
 * <ngts-sparkles [options]="{ count: 50, scale: 2, size: 6, speed: 0.4, color: 'gold' }" />
 * ```
 */
@Component({
	selector: 'ngts-sparkles',
	template: `
		<ngt-primitive *args="[sparkles()]" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSparkles {
	/** Configuration options for the sparkles effect. */
	options = input(defaultSparklesOptions, { transform: mergeInputs(defaultSparklesOptions) });
	protected parameters = omit(this.options, ['noise', 'count', 'speed', 'opacity', 'scale', 'size', 'color']);
	private sparklesOptions = pick(this.options, ['noise', 'count', 'speed', 'opacity', 'scale', 'size', 'color']);

	private store = injectStore();

	/**
	 * The underlying Sparkles instance containing the points geometry and material.
	 * Exposes the Three.js Points object for advanced manipulation.
	 */
	sparkles = computed(() => {
		const s = new Sparkles(this.sparklesOptions());
		s.setPixelRatio(this.store.snapshot.viewport.dpr);
		return s;
	});

	constructor() {
		beforeRender(({ clock }) => {
			this.sparkles().update(clock.elapsedTime);
		});
	}
}
