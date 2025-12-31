import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { SMAAEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the SMAA effect.
 * Derived from SMAAEffect constructor parameters.
 */
export type SMAAEffectOptions = Partial<NonNullable<ConstructorParameters<typeof SMAAEffect>[0]>>;

/**
 * Angular component that applies Subpixel Morphological Anti-Aliasing (SMAA).
 *
 * SMAA is a high-quality, efficient anti-aliasing technique that provides
 * better results than FXAA while being less demanding than multisampling.
 * It's particularly effective at smoothing edges while preserving sharpness.
 *
 * @example
 * ```html
 * <ngtp-effect-composer [options]="{ multisampling: 0 }">
 *   <ngtp-smaa />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- With preset -->
 * <ngtp-effect-composer>
 *   <ngtp-smaa [options]="{ preset: SMAAPreset.ULTRA }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-smaa',
	template: `
		<ngt-sMAA-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-sMAA-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpSMAA {
	/**
	 * Configuration options for the SMAA effect.
	 * @see SMAAEffectOptions
	 */
	options = input({} as Omit<SMAAEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ SMAAEffect });
	}
}
