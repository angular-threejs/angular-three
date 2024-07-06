import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { SMAAEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective } from '../effect';

extend({ SMAAEffect });

export type SMAAEffectOptions = Partial<NonNullable<ConstructorParameters<typeof SMAAEffect>[0]>>;

@Component({
	selector: 'ngtp-smaa',
	template: `
		<ngt-sMAA-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-sMAA-effect>
	`,
	standalone: true,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
})
export class NgtpSMAA {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<SMAAEffectOptions, 'blendFunction'>);
}
