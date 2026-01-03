import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, TiltShiftEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

/**
 * Configuration options for the tilt-shift effect.
 * Derived from TiltShiftEffect constructor parameters.
 */
export type TiltShiftEffectOptions = Partial<NonNullable<ConstructorParameters<typeof TiltShiftEffect>[0]>>;

/**
 * Angular component that applies a tilt-shift blur effect.
 *
 * This effect simulates the shallow depth of field look from tilt-shift
 * photography, creating a "miniature" or "diorama" appearance where only
 * a horizontal band of the image is in focus.
 *
 * Uses the postprocessing library's built-in TiltShiftEffect.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-tilt-shift [options]="{ blur: 0.5, offset: 0.5 }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @see NgtpTiltShift2 for an alternative implementation with different parameters
 */
@Component({
	selector: 'ngtp-tilt-shift',
	template: `
		<ngt-tilt-shift-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-tilt-shift-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.ADD })],
})
export class NgtpTiltShift {
	/**
	 * Configuration options for the tilt-shift effect.
	 * @see TiltShiftEffectOptions
	 */
	options = input({} as Omit<TiltShiftEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<TiltShiftEffect>>('effect');

	constructor() {
		extend({ TiltShiftEffect });
	}
}
