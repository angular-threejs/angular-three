import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three-old';
import { HueSaturationEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ HueSaturationEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-hue-saturation': { hue?: number; saturation?: number } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-hue-saturation',
	standalone: true,
	template: `
		<ngt-hue-saturation-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-hue-saturation-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpHueSaturation extends NgtpEffect<HueSaturationEffect> {}
