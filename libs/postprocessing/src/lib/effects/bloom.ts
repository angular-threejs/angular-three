import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, BloomEffect, BloomEffectOptions } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective, provideDefaultEffectOptions } from '../effect';

extend({ BloomEffect });

@Component({
	selector: 'ngtp-bloom',
	standalone: true,
	template: `
		<ngt-bloom-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-bloom-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [NgtpEffectHostDirective],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.ADD })],
})
export class NgtpBloom {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<BloomEffectOptions, 'blendFunction'>);
}
