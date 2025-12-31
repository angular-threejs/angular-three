import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BrightnessContrastEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the brightness/contrast effect.
 * Derived from BrightnessContrastEffect constructor parameters.
 */
export type BrightnessEffectOptions = NonNullable<ConstructorParameters<typeof BrightnessContrastEffect>[0]>;

/**
 * Angular component that applies brightness and contrast adjustments to the scene.
 *
 * This effect allows you to modify the overall brightness and contrast of the
 * rendered scene as a postprocessing step.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-brightness-contrast [options]="{ brightness: 0.1, contrast: 0.2 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-brightness-contrast',
	template: `
		<ngt-brightness-contrast-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-brightness-contrast-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpBrightnessContrast {
	/**
	 * Configuration options for the brightness/contrast effect.
	 * @see BrightnessEffectOptions
	 */
	options = input({} as Omit<BrightnessEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ BrightnessContrastEffect });
	}
}
