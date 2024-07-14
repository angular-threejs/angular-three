import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { ENVIRONMENT_PRESETS, NgtsEnvironmentPresets, NgtsStage, NgtsStageOptions } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, select } from '../setup-canvas';

const environments = Object.keys(ENVIRONMENT_PRESETS) as Array<NgtsEnvironmentPresets>;
const presets = ['rembrandt', 'portrait', 'upfront', 'soft'];

@Component({
	standalone: true,
	template: `
		<ngts-stage [options]="options()">
			<ngt-mesh>
				<ngt-sphere-geometry *args="[1, 64, 64]" />
				<ngt-mesh-standard-material [roughness]="0" color="royalblue" />
			</ngt-mesh>
		</ngts-stage>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsStage, NgtArgs],
})
class DefaultStageStory {
	options = input({} as NgtsStageOptions);
}

export default {
	title: 'Staging/Stage',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultStageStory, {
	canvasOptions: { camera: { position: [0, 0, 3] }, background: 'white' },
	argsOptions: {
		options: {
			intensity: 1,
			environment: select(environments[0], { options: environments }),
			preset: select('rembrandt', { options: presets }),
		},
	},
});
