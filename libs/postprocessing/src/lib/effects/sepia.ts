import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { SepiaEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

extend({ SepiaEffect });

export type SepiaEffectOptions = Partial<NonNullable<ConstructorParameters<typeof SepiaEffect>[0]>>;

@Component({
    selector: 'ngtp-sepia',
    template: `
		<ngt-sepia-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-sepia-effect>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtArgs, NgtpEffectBlendMode],
    hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }]
})
export class NgtpSepia {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<SepiaEffectOptions, 'blendFunction'>);
}
