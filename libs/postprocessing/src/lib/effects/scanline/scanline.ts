import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, ScanlineEffect } from 'postprocessing';
import { NgtpEffect, type NgtpEffectState } from '../../effect';

extend({ ScanlineEffect });

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-scanline': { density?: number } & NgtpEffectState;
	}
}

@Component({
	selector: 'ngtp-scanline',
	standalone: true,
	template: `
		<ngt-scanline-effect ngtCompound *args="args()" [camera]="camera()" [ref]="effectRef">
			<ng-content />
		</ngt-scanline-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpScanline extends NgtpEffect<ScanlineEffect> {
	override defaultBlendFunction = BlendFunction.OVERLAY;
}
