import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three-old';
import { NgtsDetailed } from 'angular-three-soba-old/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
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
		<ngts-orbit-controls [enablePan]="false" [enableRotate]="false" [zoomSpeed]="0.5" />
	`,
	imports: [NgtsDetailed, NgtsOrbitControls, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultDetailedStory {}

export default {
	title: 'Abstractions/Detailed',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultDetailedStory, {
	controls: false,
	camera: { position: [0, 0, 100] },
});
