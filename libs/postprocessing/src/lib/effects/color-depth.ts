import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ColorDepthEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the color depth effect.
 * Derived from ColorDepthEffect constructor parameters.
 */
export type ColorDepthEffectOptions = Partial<NonNullable<ConstructorParameters<typeof ColorDepthEffect>[0]>>;

/**
 * Angular component that applies a color depth reduction effect to the scene.
 *
 * This effect reduces the number of colors in the scene, creating a posterized
 * or retro look similar to older display hardware with limited color palettes.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-color-depth [options]="{ bits: 4 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-color-depth',
	template: `
		<ngt-color-depth-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-color-depth-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpColorDepth {
	/**
	 * Configuration options for the color depth effect.
	 * @see ColorDepthEffectOptions
	 */
	options = input({} as Omit<ColorDepthEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ ColorDepthEffect });
	}
}
