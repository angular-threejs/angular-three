import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, omit, pick } from 'angular-three';
import { GridEffect } from 'postprocessing';

/**
 * Configuration options for the grid effect.
 * Extends GridEffect options with optional size configuration.
 */
type GridOptions = NonNullable<ConstructorParameters<typeof GridEffect>[0]> &
	Partial<{
		/** Custom size for the grid effect */
		size: { width: number; height: number };
	}>;

/**
 * Angular component that applies a grid overlay effect to the scene.
 *
 * This effect overlays a grid pattern on the rendered scene, which can be
 * useful for technical visualization or stylized effects.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-grid [options]="{ scale: 1.5, lineWidth: 0.5 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-grid',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpGrid {
	/**
	 * Configuration options for the grid effect.
	 * @see GridOptions
	 */
	options = input({} as GridOptions);

	private effectOptions = omit(this.options, ['size']);
	private size = pick(this.options, 'size');

	/** The underlying GridEffect instance */
	protected effect = computed(() => new GridEffect(this.effectOptions()));

	constructor() {
		effect(() => {
			const [size, effect] = [this.size(), this.effect()];
			if (size) {
				effect.setSize(size.width, size.height);
			}
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
