import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, NoiseEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

/**
 * Configuration options for the noise effect.
 * Derived from NoiseEffect constructor parameters.
 */
export type NoiseEffectOptions = Partial<NonNullable<ConstructorParameters<typeof NoiseEffect>[0]>>;

/**
 * Angular component that applies a noise/grain effect to the scene.
 *
 * This effect adds film grain or noise to the rendered image, which can
 * add a cinematic quality or help hide banding in gradients.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-noise [options]="{ premultiply: true }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-noise',
	template: `
		<ngt-noise-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-noise-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.COLOR_DODGE })],
})
export class NgtpNoise {
	/**
	 * Configuration options for the noise effect.
	 * @see NoiseEffectOptions
	 */
	options = input({} as Omit<NoiseEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ NoiseEffect });
	}
}
