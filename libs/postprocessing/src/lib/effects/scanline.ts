import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, ScanlineEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

export type ScanlineEffectOptions = Partial<NonNullable<ConstructorParameters<typeof ScanlineEffect>[0]>>;

const defaultOptions: Omit<ScanlineEffectOptions, 'blendFunction'> = {
	density: 1.25,
};

@Component({
	selector: 'ngtp-scanline',
	template: `
		<ngt-scanline-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-scanline-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.OVERLAY })],
})
export class NgtpScanline {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ ScanlineEffect });
	}
}
