import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, ColorAverageEffect } from 'postprocessing';

/**
 * Angular component that applies a color averaging effect to the scene.
 *
 * This effect converts the scene to grayscale by averaging the color channels,
 * which can create a desaturated or monochrome look.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-color-average />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- With custom blend function -->
 * <ngtp-effect-composer>
 *   <ngtp-color-average [options]="{ blendFunction: BlendFunction.MULTIPLY }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-color-average',
	template: `
		<ngt-color-average-effect *args="[options().blendFunction]">
			<ng-content />
		</ngt-color-average-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpColorAverage {
	/**
	 * Configuration options for the color average effect.
	 * @default { blendFunction: BlendFunction.NORMAL }
	 */
	options = input(
		{ blendFunction: BlendFunction.NORMAL },
		{ transform: mergeInputs({ blendFunction: BlendFunction.NORMAL }) },
	);

	constructor() {
		extend({ ColorAverageEffect });
	}
}
