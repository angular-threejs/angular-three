import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { FXAAEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ FXAAEffect });

export type FXAAEffectOptions = Partial<NonNullable<ConstructorParameters<typeof FXAAEffect>[0]>>;

@Component({
	selector: 'ngtp-fxaa',
	template: `
		<ngt-fXAA-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-fXAA-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpFXAA {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<FXAAEffectOptions, 'blendFunction'>);
}
