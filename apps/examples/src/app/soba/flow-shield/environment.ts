import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgtsEnvironment, type NgtsEnvironmentPresets } from 'angular-three-soba/staging';

@Component({
	selector: 'app-environment',
	template: `
		<ngts-environment
			[options]="{
				preset: preset(),
				background: true,
				backgroundBlurriness: 0.9,
				backgroundIntensity: 0.1,
				environmentIntensity: 0.3,
			}"
		/>
	`,
	imports: [NgtsEnvironment],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Environment {
	preset = input.required<NgtsEnvironmentPresets>();
}
