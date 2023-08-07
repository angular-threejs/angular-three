import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { ENVIRONMENT_PRESETS, NgtsStage } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number, select } from '../setup-canvas';

enum presets {
	rembrandt = 'rembrandt',
	portrait = 'portrait',
	upfront = 'upfront',
	soft = 'soft',
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['white']" />
		<ngts-stage [intensity]="intensity" [environment]="envPreset" [preset]="preset">
			<ngt-mesh>
				<ngt-sphere-geometry *args="[1, 64, 64]" />
				<ngt-mesh-standard-material roughness="0" color="royalblue" />
			</ngt-mesh>
		</ngts-stage>
	`,
	imports: [NgtsStage, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultStageStory {
	@Input() intensity = 1;
	@Input() envPreset = Object.keys(ENVIRONMENT_PRESETS)[0];
	@Input() preset = Object.keys(presets)[0];
}

export default {
	title: 'Staging/Stage',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultStageStory, {
	canvasOptions: { camera: { position: [0, 0, 3] } },
	argsOptions: {
		intensity: number(1),
		envPreset: select(Object.keys(ENVIRONMENT_PRESETS)[0], {
			options: Object.keys(ENVIRONMENT_PRESETS),
		}),
		preset: select(Object.keys(presets)[0], { options: Object.keys(presets) }),
	},
});
