import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three-old';
import { DepthEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ DepthEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-depth': { inverted?: boolean } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-depth',
	standalone: true,
	template: `
		<ngt-depth-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-depth-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpDepth extends NgtpEffect<DepthEffect> {}
