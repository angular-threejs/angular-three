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
import { DotScreenEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the dot screen effect.
 * Derived from DotScreenEffect constructor parameters.
 */
export type DotScreenEffectOptions = Partial<NonNullable<ConstructorParameters<typeof DotScreenEffect>[0]>>;

/**
 * Angular component that applies a dot screen effect to the scene.
 *
 * This effect overlays a pattern of dots on the scene, creating a halftone
 * or comic book style appearance.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-dot-screen [options]="{ scale: 1.5, angle: Math.PI * 0.25 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-dot-screen',
	template: `
		<ngt-dot-screen-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-dot-screen-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpDotScreen {
	/**
	 * Configuration options for the dot screen effect.
	 * @see DotScreenEffectOptions
	 */
	options = input({} as Omit<DotScreenEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<DotScreenEffect>>('effect');

	constructor() {
		extend({ DotScreenEffect });
	}
}
