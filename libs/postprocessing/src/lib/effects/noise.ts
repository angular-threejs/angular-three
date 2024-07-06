import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, NoiseEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective, provideDefaultEffectOptions } from '../effect';

extend({ NoiseEffect });

export type NoiseEffectOptions = Partial<NonNullable<ConstructorParameters<typeof NoiseEffect>[0]>>;

@Component({
	selector: 'ngtp-noise',
	template: `
		<ngt-noise-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-noise-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.COLOR_DODGE })],
})
export class NgtpNoise {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<NoiseEffectOptions, 'blendFunction'>);
}
