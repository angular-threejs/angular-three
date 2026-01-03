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
import { DepthEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

/**
 * Configuration options for the depth effect.
 * Derived from DepthEffect constructor parameters.
 */
export type DepthEffectOptions = Partial<NonNullable<ConstructorParameters<typeof DepthEffect>[0]>>;

/**
 * Angular component that visualizes the scene's depth buffer.
 *
 * This effect renders the depth information of the scene, which can be useful
 * for debugging or creating stylized depth-based visualizations.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-depth [options]="{ inverted: true }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-depth',
	template: `
		<ngt-depth-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-depth-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpDepth {
	/**
	 * Configuration options for the depth effect.
	 * @see DepthEffectOptions
	 */
	options = input({} as Omit<DepthEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<DepthEffect>>('effect');

	constructor() {
		extend({ DepthEffect });
	}
}
