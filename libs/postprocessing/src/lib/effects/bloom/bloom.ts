import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, BloomEffect, type BloomEffectOptions } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ BloomEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-bloom': BloomEffectOptions & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-bloom',
	standalone: true,
	template: `
		<ngt-bloom-effect ngtCompound *args="args()" [ref]="effectRef" [camera]="camera()">
			<ng-content />
		</ngt-bloom-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpBloom extends NgtpEffect<BloomEffect> {
	override defaultBlendFunction = BlendFunction.ADD;
}
