import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ShockWaveEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ ShockWaveEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-shock-wave': {
			speed?: number;
			maxRadius?: number;
			waveSize?: number;
			amplitude?: number;
		} & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-shock-wave',
	standalone: true,
	template: `
		<ngt-shock-wave-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-shock-wave-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpShockWave extends NgtpEffect<ShockWaveEffect> {}
