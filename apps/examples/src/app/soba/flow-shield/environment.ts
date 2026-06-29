import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { FlowShieldState } from './state';

@Component({
	selector: 'app-environment',
	template: `
		<ngts-environment
			[options]="{
				preset: state.environment.preset(),
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
	protected state = inject(FlowShieldState);
}
