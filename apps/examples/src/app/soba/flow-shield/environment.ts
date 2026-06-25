import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtsEnvironment } from 'angular-three-soba/staging';

@Component({
	selector: 'app-environment',
	template: `
		<ngts-environment
			[options]="{
				preset: 'night',
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
export class Environment {}
