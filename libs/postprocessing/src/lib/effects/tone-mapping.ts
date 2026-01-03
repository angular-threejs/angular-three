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
import { ToneMappingEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the tone mapping effect.
 * Derived from ToneMappingEffect constructor parameters.
 */
export type ToneMappingEffectOptions = NonNullable<ConstructorParameters<typeof ToneMappingEffect>[0]>;

/**
 * Angular component that applies tone mapping to the scene.
 *
 * Tone mapping converts HDR (High Dynamic Range) values to LDR (Low Dynamic
 * Range) for display. Various tone mapping modes are available including
 * Reinhard, ACES Filmic, and custom linear options.
 *
 * Note: The effect composer disables Three.js's built-in tone mapping,
 * so this effect should be used if tone mapping is desired.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-tone-mapping [options]="{ mode: ToneMappingMode.ACES_FILMIC }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-tone-mapping',
	template: `
		<ngt-tone-mapping-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-tone-mapping-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpToneMapping {
	/**
	 * Configuration options for the tone mapping effect.
	 * @see ToneMappingEffectOptions
	 */
	options = input({} as Omit<ToneMappingEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<ToneMappingEffect>>('effect');

	constructor() {
		extend({ ToneMappingEffect });
	}
}
