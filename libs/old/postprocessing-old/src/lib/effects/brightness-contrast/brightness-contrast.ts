import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three-old';
import { BrightnessContrastEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ BrightnessContrastEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-brightness-contrast': { brightness?: number; contrast?: number } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-brightness-contrast',
	standalone: true,
	template: `
		<ngt-brightness-contrast-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-brightness-contrast-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpBrightnessContrast extends NgtpEffect<BrightnessContrastEffect> {}
