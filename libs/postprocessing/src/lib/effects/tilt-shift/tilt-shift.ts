import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, KernelSize, TiltShiftEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ TiltShiftEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-tilt-shift': {
			offset?: number;
			rotation?: number;
			focusArea?: number;
			feather?: number;
			bias?: number;
			kernelSize?: KernelSize;
			resolutionScale?: number;
			resolutionX?: number;
			resolutionY?: number;
		} & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-tilt-shift',
	standalone: true,
	template: `
		<ngt-tilt-shift-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-tilt-shift-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpTiltShift extends NgtpEffect<TiltShiftEffect> {
	override defaultBlendFunction = BlendFunction.ADD;
}
