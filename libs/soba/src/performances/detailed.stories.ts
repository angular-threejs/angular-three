import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsDetailed } from 'angular-three-soba/performances';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-detailed [distances]="[0, 50, 150]">
			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[10, 3]" />
				<ngt-mesh-basic-material color="hotpink" [wireframe]="true" />
			</ngt-mesh>

			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[10, 2]" />
				<ngt-mesh-basic-material color="lightgreen" [wireframe]="true" />
			</ngt-mesh>

			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[10, 1]" />
				<ngt-mesh-basic-material color="lightblue" [wireframe]="true" />
			</ngt-mesh>
		</ngts-detailed>

		<ngts-orbit-controls [options]="{ enablePan: false, enableRotate: false, zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsDetailed, NgtArgs, NgtsOrbitControls],
})
class DefaultDetailedStory {}

export default {
	title: 'Performances/Detailed',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultDetailedStory, {
	camera: { position: [0, 0, 100] },
	controls: false,
});
