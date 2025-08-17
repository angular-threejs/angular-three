import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtsCloud, NgtsClouds } from 'angular-three-soba/staging';
import { storyDecorators, storyObject } from '../setup-canvas';

@Component({
	template: `
		<ngts-clouds>
			<ngts-cloud [options]="{ position: [-4, -2, 0], color: '#ff6b9d' }" />
			<ngts-cloud [options]="{ position: [-4, 2, 0], color: '#c44569' }" />
			<ngts-cloud [options]="{ color: '#feca57' }" />
			<ngts-cloud [options]="{ position: [4, -2, 0], color: '#48dbfb' }" />
			<ngts-cloud [options]="{ position: [4, 2, 0], color: '#ff9ff3' }" />
		</ngts-clouds>
	`,
	imports: [NgtsCloud, NgtsClouds],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultCloudStory {}

export default {
	title: 'Staging/Cloud',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyObject(DefaultCloudStory, {
	camera: { position: [0, 5, 10] },
});
