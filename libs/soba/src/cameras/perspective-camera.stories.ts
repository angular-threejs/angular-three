import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { makeDecorators, makeStoryObject } from '../setup-canvas';
import { positions } from './positions';

@Component({
	standalone: true,
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [0, 0, 10] }" />

		<ngt-group [position]="[0, 0, -10]">
			@for (position of positions(); track position.id) {
				<ngt-mesh [position]="position.position">
					<ngt-icosahedron-geometry *args="[1, 1]" />
					<ngt-mesh-basic-material color="white" [wireframe]="true" />
				</ngt-mesh>
			}
		</ngt-group>
	`,
	imports: [NgtsPerspectiveCamera, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultPerspectiveCameraStory {
	positions = positions;
}

export default {
	title: 'Camera/PerspectiveCamera',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultPerspectiveCameraStory);
