import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { SMAAEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

export type SMAAEffectOptions = Partial<NonNullable<ConstructorParameters<typeof SMAAEffect>[0]>>;

@Component({
	selector: 'ngtp-smaa',
	template: `
		<ngt-sMAA-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-sMAA-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpSMAA {
	options = input({} as Omit<SMAAEffectOptions, 'blendFunction'>);
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ SMAAEffect });
	}
}
