import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtsPivotControls, NgtsPivotControlsOptions } from 'angular-three-soba/controls';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-pivot-controls [options]="options()">
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-standard-material />
			</ngt-mesh>
		</ngts-pivot-controls>
		<ngt-directional-light [position]="[10, 10, 5]" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPivotControls],
})
class DefaultPivotControlsStory {
	options = input({} as NgtsPivotControlsOptions);
}

export default {
	title: 'Controls/PivotControls',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultPivotControlsStory, {
	canvasOptions: { camera: { position: [0, 0, 2.5] } },
	argsOptions: {
		options: {
			anchor: [-1, -1, -1],
			scale: 0.75,
			depthTest: false,
			annotations: true,
		},
	},
});
