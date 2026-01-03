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
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, ScanlineEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

/**
 * Configuration options for the scanline effect.
 * Derived from ScanlineEffect constructor parameters.
 */
export type ScanlineEffectOptions = Partial<NonNullable<ConstructorParameters<typeof ScanlineEffect>[0]>>;

const defaultOptions: Omit<ScanlineEffectOptions, 'blendFunction'> = {
	density: 1.25,
};

/**
 * Angular component that applies a scanline effect to the scene.
 *
 * This effect overlays horizontal scanlines on the image, simulating
 * the appearance of old CRT monitors or television screens.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-scanline [options]="{ density: 2.0 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-scanline',
	template: `
		<ngt-scanline-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-scanline-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.OVERLAY })],
})
export class NgtpScanline {
	/**
	 * Configuration options for the scanline effect.
	 * @default { density: 1.25 }
	 * @see ScanlineEffectOptions
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	/** Reference to the host NgtpEffect directive */
	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<ScanlineEffect>>('effect');

	constructor() {
		extend({ ScanlineEffect });
	}
}
