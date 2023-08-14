import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, NoiseEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ NoiseEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-noise': { premultiply?: boolean } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-noise',
	standalone: true,
	template: `
		<ngt-noise-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-noise-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpNoise extends NgtpEffect<NoiseEffect> {
	override defaultBlendFunction = BlendFunction.COLOR_DODGE;
}
