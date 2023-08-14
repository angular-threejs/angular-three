import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { SepiaEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ SepiaEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-sepia': { intensity?: number } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-sepia',
	standalone: true,
	template: `
		<ngt-sepia-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-sepia-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpSepia extends NgtpEffect<SepiaEffect> {}
