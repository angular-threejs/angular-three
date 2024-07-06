import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { VignetteEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ VignetteEffect });

export type VignetteEffectOptions = Partial<NonNullable<ConstructorParameters<typeof VignetteEffect>[0]>>;

@Component({
	selector: 'ngtp-vignette',
	template: `
		<ngt-vignette-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-vignette-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpVignette {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<VignetteEffectOptions, 'blendFunction'>);
}
