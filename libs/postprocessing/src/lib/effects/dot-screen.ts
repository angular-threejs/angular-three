import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { DotScreenEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ DotScreenEffect });

export type DotScreenEffectOptions = Partial<NonNullable<ConstructorParameters<typeof DotScreenEffect>[0]>>;

@Component({
	selector: 'ngtp-dot-screen',
	template: `
		<ngt-dot-screen-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-dot-screen-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpDotScreen {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<DotScreenEffectOptions, 'blendFunction'>);
}
