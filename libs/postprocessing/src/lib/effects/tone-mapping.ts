import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { ToneMappingEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

extend({ ToneMappingEffect });

export type ToneMappingEffectOptions = NonNullable<ConstructorParameters<typeof ToneMappingEffect>[0]>;

@Component({
	selector: 'ngtp-tone-mapping',
	template: `
		<ngt-tone-mapping-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-tone-mapping-effect>
	`,
	imports: [NgtArgs, NgtpEffectBlendMode],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpToneMapping {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<ToneMappingEffectOptions, 'blendFunction'>);
}
