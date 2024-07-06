import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BrightnessContrastEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ BrightnessContrastEffect });

export type BrightnessEffectOptions = NonNullable<ConstructorParameters<typeof BrightnessContrastEffect>[0]>;

@Component({
	selector: 'ngtp-brightness-contrast',
	standalone: true,
	template: `
		<ngt-brightness-contrast-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-brightness-contrast-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpBrightnessContrast {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<BrightnessEffectOptions, 'blendFunction'>);
}
