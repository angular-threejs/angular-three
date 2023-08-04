import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { NgtsCenter, NgtsFloat } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-center>
			<ngts-float [floatIntensity]="5" [speed]="2">
				<ngts-text-3d
					font="soba/helvetiker_regular.typeface.json"
					[bevelEnabled]="true"
					[bevelSize]="0.05"
					[text]="text"
				>
					<ngt-mesh-normal-material />
				</ngts-text-3d>
			</ngts-float>
		</ngts-center>
	`,
	imports: [NgtsCenter, NgtsFloat, NgtsText3D],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultText3DStory {
	@Input() text = 'Angular Three';
}

export default {
	title: 'Abstractions/Text 3D',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultText3DStory, {
	canvasOptions: { camera: { position: [0, 0, 10] } },
	argsOptions: { text: 'Angular Three' },
});
