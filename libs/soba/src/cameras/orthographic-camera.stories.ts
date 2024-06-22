import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrthographicCamera } from 'angular-three-soba/cameras';
import { makeDecorators, makeStoryObject } from '../setup-canvas';
import { positions } from './positions';

@Component({
	standalone: true,
	template: `
		<ngts-orthographic-camera [options]="{ makeDefault: true, zoom: 40, position: [0, 0, 10] }" />

		<ngt-group [position]="[0, 0, -10]">
			@for (position of positions(); track position.id) {
				<ngt-mesh [position]="position.position">
					<ngt-icosahedron-geometry *args="[1, 1]" />
					<ngt-mesh-basic-material color="white" [wireframe]="true" />
				</ngt-mesh>
			}
		</ngt-group>
	`,
	imports: [NgtsOrthographicCamera, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultOrthographicCameraStory {
	positions = positions;
}

export default {
	title: 'Camera/OrthographicCamera',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultOrthographicCameraStory);
