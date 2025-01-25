import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { FXAAEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

export type FXAAEffectOptions = Partial<NonNullable<ConstructorParameters<typeof FXAAEffect>[0]>>;

@Component({
	selector: 'ngtp-fxaa',
	template: `
		<ngt-fXAA-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-fXAA-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpFXAA {
	options = input({} as Omit<FXAAEffectOptions, 'blendFunction'>);
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ FXAAEffect });
	}
}
