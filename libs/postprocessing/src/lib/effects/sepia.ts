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
import { SepiaEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the sepia effect.
 * Derived from SepiaEffect constructor parameters.
 */
export type SepiaEffectOptions = Partial<NonNullable<ConstructorParameters<typeof SepiaEffect>[0]>>;

/**
 * Angular component that applies a sepia tone effect to the scene.
 *
 * This effect gives the rendered image a warm, brownish tint similar to
 * old photographs, creating a vintage or nostalgic appearance.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-sepia [options]="{ intensity: 0.5 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-sepia',
	template: `
		<ngt-sepia-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-sepia-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpSepia {
	/**
	 * Configuration options for the sepia effect.
	 * @see SepiaEffectOptions
	 */
	options = input({} as Omit<SepiaEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<SepiaEffect>>('effect');

	constructor() {
		extend({ SepiaEffect });
	}
}
