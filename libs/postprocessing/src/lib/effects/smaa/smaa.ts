import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { EdgeDetectionMode, PredicationMode, SMAAEffect, SMAAPreset } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ SMAAEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-SMAA': {
			preset?: SMAAPreset;
			edgeDetectionMode?: EdgeDetectionMode;
			predicationMode?: PredicationMode;
		} & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-SMAA',
	standalone: true,
	template: `
		<ngt-SMAA-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-SMAA-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpSMAA extends NgtpEffect<SMAAEffect> {}
