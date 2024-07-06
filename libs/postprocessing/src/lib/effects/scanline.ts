import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, ScanlineEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective, provideDefaultEffectOptions } from '../effect';

extend({ ScanlineEffect });

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
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.OVERLAY })],
})
export class NgtpScanline {
	effect = inject(NgtpEffect, { host: true });
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
}
