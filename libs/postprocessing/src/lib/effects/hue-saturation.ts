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
import { HueSaturationEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the hue/saturation effect.
 * Derived from HueSaturationEffect constructor parameters.
 */
export type HueSaturationEffectOptions = Partial<NonNullable<ConstructorParameters<typeof HueSaturationEffect>[0]>>;

/**
 * Angular component that applies hue and saturation adjustments to the scene.
 *
 * This effect allows you to shift the hue and adjust the saturation of the
 * rendered scene as a postprocessing step.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-hue-saturation [options]="{ hue: 0.5, saturation: 0.2 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-hue-saturation',
	template: `
		<ngt-hue-saturation-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-hue-saturation-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpHueSaturation {
	/**
	 * Configuration options for the hue/saturation effect.
	 * @see HueSaturationEffectOptions
	 */
	options = input({} as Omit<HueSaturationEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<HueSaturationEffect>>('effect');

	constructor() {
		extend({ HueSaturationEffect });
	}
}
