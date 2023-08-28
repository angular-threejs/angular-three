import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsCloud } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-cloud [position]="[-4, -2, 0]" />
		<ngts-cloud [position]="[-4, 2, 0]" />
		<ngts-cloud />
		<ngts-cloud [position]="[4, -2, 0]" />
		<ngts-cloud [position]="[4, 2, 0]" />
		<ngts-orbit-controls [enablePan]="false" [zoomSpeed]="0.5" />
	`,
	imports: [NgtsCloud, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultCloudStory {}

export default {
	title: 'Staging/Cloud',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultCloudStory, {
	camera: { position: [0, 0, 10] },
	controls: false,
});
