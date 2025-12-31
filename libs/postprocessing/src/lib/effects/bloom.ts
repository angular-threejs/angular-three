import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, BloomEffect, BloomEffectOptions } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

/**
 * Angular component that applies a bloom postprocessing effect to the scene.
 *
 * The bloom effect creates a glow around bright areas of the scene, simulating
 * the way bright light bleeds in cameras and the human eye.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-bloom [options]="{ intensity: 1, luminanceThreshold: 0.9 }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- With custom blend function -->
 * <ngtp-effect-composer>
 *   <ngtp-bloom
 *     [blendFunction]="BlendFunction.SCREEN"
 *     [options]="{ intensity: 0.5, luminanceSmoothing: 0.9 }"
 *   />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-bloom',
	template: `
		<ngt-bloom-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-bloom-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.ADD })],
})
export class NgtpBloom {
	/**
	 * Configuration options for the bloom effect.
	 * Accepts all BloomEffectOptions except blendFunction (use the blendFunction input instead).
	 * @see BloomEffectOptions from postprocessing library
	 */
	options = input({} as Omit<BloomEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ BloomEffect });
	}
}
