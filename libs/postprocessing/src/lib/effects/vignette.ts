import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { VignetteEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the vignette effect.
 * Derived from VignetteEffect constructor parameters.
 */
export type VignetteEffectOptions = Partial<NonNullable<ConstructorParameters<typeof VignetteEffect>[0]>>;

/**
 * Angular component that applies a vignette effect to the scene.
 *
 * This effect darkens the corners and edges of the image, drawing the
 * viewer's attention to the center. It's a common cinematic technique
 * for creating focus and atmosphere.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-vignette [options]="{ darkness: 0.5, offset: 0.3 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-vignette',
	template: `
		<ngt-vignette-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-vignette-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpVignette {
	/**
	 * Configuration options for the vignette effect.
	 * @see VignetteEffectOptions
	 */
	options = input({} as Omit<VignetteEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ VignetteEffect });
	}
}
