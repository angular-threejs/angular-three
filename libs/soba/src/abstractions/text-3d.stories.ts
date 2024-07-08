import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { NgtsCenter } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-center>
			<ngts-text-3d
				text="hello
world"
				font="helvetiker_regular.typeface.json"
				[options]="{
					curveSegments: 32,
					bevelEnabled: true,
					bevelSize: 0.04,
					bevelThickness: 0.1,
					height: 0.5,
					lineHeight: 0.5,
					letterSpacing: -0.06,
					size: 1.5,
				}"
			>
				<ngt-mesh-normal-material />
			</ngts-text-3d>
		</ngts-center>

		<ngt-axes-helper [scale]="2" />
	`,
	imports: [NgtsCenter, NgtsText3D],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultText3DStory {}

export default {
	title: 'Abstractions/Text3D',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultText3DStory, {
	camera: { position: [-1.5, 1.5, 3.5] },
});
