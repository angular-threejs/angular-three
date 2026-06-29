import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { FlowShieldState } from './state';

@Component({
	selector: 'app-environment',
	template: `
		<ngts-environment
			[options]="{
				preset: state.environment.preset(),
				background: state.environment.background(),
				backgroundBlurriness: state.environment.backgroundBlurriness(),
				backgroundIntensity: state.environment.backgroundIntensity(),
				environmentIntensity: state.environment.environmentIntensity(),
			}"
		/>
	`,
	imports: [NgtsEnvironment],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Environment {
	protected state = inject(FlowShieldState);
}
