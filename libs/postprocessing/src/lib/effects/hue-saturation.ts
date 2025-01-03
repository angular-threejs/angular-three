import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { HueSaturationEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

extend({ HueSaturationEffect });

export type HueSaturationEffectOptions = Partial<NonNullable<ConstructorParameters<typeof HueSaturationEffect>[0]>>;

@Component({
	selector: 'ngtp-hue-saturation',
	template: `
		<ngt-hue-saturation-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-hue-saturation-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpHueSaturation {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<HueSaturationEffectOptions, 'blendFunction'>);
}
