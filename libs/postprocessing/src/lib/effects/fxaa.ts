import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { FXAAEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the FXAA effect.
 * Derived from FXAAEffect constructor parameters.
 */
export type FXAAEffectOptions = Partial<NonNullable<ConstructorParameters<typeof FXAAEffect>[0]>>;

/**
 * Angular component that applies Fast Approximate Anti-Aliasing (FXAA) to the scene.
 *
 * FXAA is a fast, single-pass anti-aliasing technique that smooths jagged edges
 * in the rendered image. It's less demanding than multisampling but may blur
 * some fine details.
 *
 * @example
 * ```html
 * <ngtp-effect-composer [options]="{ multisampling: 0 }">
 *   <ngtp-fxaa />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-fxaa',
	template: `
		<ngt-fXAA-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-fXAA-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpFXAA {
	/**
	 * Configuration options for the FXAA effect.
	 * @see FXAAEffectOptions
	 */
	options = input({} as Omit<FXAAEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ FXAAEffect });
	}
}
