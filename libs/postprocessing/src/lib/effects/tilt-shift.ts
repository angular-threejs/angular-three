import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, TiltShiftEffect } from 'postprocessing';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

extend({ TiltShiftEffect });

export type TiltShiftEffectOptions = Partial<NonNullable<ConstructorParameters<typeof TiltShiftEffect>[0]>>;

@Component({
	selector: 'ngtp-tilt-shift',
	template: `
		<ngt-tilt-shift-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-tilt-shift-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.ADD })],
})
export class NgtpTiltShift {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<TiltShiftEffectOptions, 'blendFunction'>);
}
