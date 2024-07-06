import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ChromaticAberrationEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ ChromaticAberrationEffect });

export type ChromaticAberrationEffectOptions = Partial<
	NonNullable<ConstructorParameters<typeof ChromaticAberrationEffect>[0]>
>;

@Component({
	selector: 'ngtp-chromatic-aberration',
	template: `
		<ngt-chromatic-aberration-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-chromatic-aberration-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpChromaticAberration {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<ChromaticAberrationEffectOptions, 'blendFunction'>);
}
