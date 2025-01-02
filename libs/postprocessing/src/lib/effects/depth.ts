import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { DepthEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

extend({ DepthEffect });

export type DepthEffectOptions = Partial<NonNullable<ConstructorParameters<typeof DepthEffect>[0]>>;

@Component({
    selector: 'ngtp-depth',
    template: `
		<ngt-depth-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-depth-effect>
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtArgs, NgtpEffectBlendMode],
    hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }]
})
export class NgtpDepth {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<DepthEffectOptions, 'blendFunction'>);
}
