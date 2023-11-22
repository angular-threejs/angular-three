import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three-old';
import { VignetteEffect, VignetteTechnique } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ VignetteEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-vignette': {
			technique?: VignetteTechnique;
			eskil?: boolean;
			offset?: number;
			darkness?: number;
		} & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-vignette',
	standalone: true,
	template: `
		<ngt-vignette-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-vignette-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpVignette extends NgtpEffect<VignetteEffect> {}
