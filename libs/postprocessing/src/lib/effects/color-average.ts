import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, ColorAverageEffect } from 'postprocessing';

extend({ ColorAverageEffect });

@Component({
	selector: 'ngtp-color-average',
	standalone: true,
	template: `
		<ngt-color-average-effect *args="[options().blendFunction]">
			<ng-content />
		</ngt-color-average-effect>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpColorAverage {
	options = input(
		{ blendFunction: BlendFunction.NORMAL },
		{ transform: mergeInputs({ blendFunction: BlendFunction.NORMAL }) },
	);
}
