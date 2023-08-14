import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ ToneMappingEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-tone-mapping': {
			adaptive?: boolean;
			mode?: ToneMappingMode;
			resolution?: number;
			maxLuminance?: number;
			whitePoint?: number;
			middleGrey?: number;
			minLuminance?: number;
			averageLuminance?: number;
			adaptationRate?: number;
		} & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-tone-mapping',
	standalone: true,
	template: `
		<ngt-tone-mapping-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-tone-mapping-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpToneMapping extends NgtpEffect<ToneMappingEffect> {}
