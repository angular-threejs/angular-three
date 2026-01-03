import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { PixelationEffect } from 'postprocessing';

/**
 * Configuration options for the pixelation effect.
 */
export interface PixelationOptions {
	/**
	 * The pixel granularity - higher values create larger pixels.
	 * @default 5
	 */
	granularity: number;
}

/**
 * Angular component that applies a pixelation effect to the scene.
 *
 * This effect reduces the resolution of the rendered image to create
 * a retro, 8-bit style appearance.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-pixelation [options]="{ granularity: 10 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-pixelation',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs],
})
export class NgtpPixelation {
	/**
	 * Configuration options for the pixelation effect.
	 * @default { granularity: 5 }
	 * @see PixelationOptions
	 */
	options = input({ granularity: 5 } as PixelationOptions, { transform: mergeInputs({ granularity: 5 }) });

	private granularity = pick(this.options, 'granularity');

	/** The underlying PixelationEffect instance */
	effect = computed(() => new PixelationEffect(this.granularity()));

	constructor() {
		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
