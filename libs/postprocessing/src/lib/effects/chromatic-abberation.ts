import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ChromaticAberrationEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the chromatic aberration effect.
 * Derived from ChromaticAberrationEffect constructor parameters.
 */
export type ChromaticAberrationEffectOptions = Partial<
	NonNullable<ConstructorParameters<typeof ChromaticAberrationEffect>[0]>
>;

/**
 * Angular component that applies a chromatic aberration effect to the scene.
 *
 * Chromatic aberration simulates the color fringing that occurs in real camera lenses
 * when different wavelengths of light are focused at different distances.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-chromatic-aberration [options]="{ offset: [0.002, 0.002] }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-chromatic-aberration',
	template: `
		<ngt-chromatic-aberration-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-chromatic-aberration-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpChromaticAberration {
	/**
	 * Configuration options for the chromatic aberration effect.
	 * @see ChromaticAberrationEffectOptions
	 */
	options = input({} as Omit<ChromaticAberrationEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ ChromaticAberrationEffect });
	}
}
