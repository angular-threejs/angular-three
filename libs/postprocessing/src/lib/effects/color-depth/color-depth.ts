import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ColorDepthEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ ColorDepthEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-color-depth': { bits?: number } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-color-depth',
	standalone: true,
	template: `
		<ngt-color-depth-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-color-depth-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpColorDepth extends NgtpEffect<ColorDepthEffect> {}
