import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ColorDepthEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ ColorDepthEffect });

export type ColorDepthEffectOptions = Partial<NonNullable<ConstructorParameters<typeof ColorDepthEffect>[0]>>;

@Component({
	selector: 'ngtp-color-depth',
	template: `
		<ngt-color-depth-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-color-depth-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpColorDepth {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<ColorDepthEffectOptions, 'blendFunction'>);
}
