import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, BloomEffect, BloomEffectOptions } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

@Component({
	selector: 'ngtp-bloom',
	template: `
		<ngt-bloom-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-bloom-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.ADD })],
})
export class NgtpBloom {
	options = input({} as Omit<BloomEffectOptions, 'blendFunction'>);

	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ BloomEffect });
	}
}
