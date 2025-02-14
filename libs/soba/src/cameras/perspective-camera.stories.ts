import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { storyDecorators, storyFunction } from '../setup-canvas';
import { positions } from './positions';

@Component({
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [0, 0, 10] }" />

		<ngt-group [position]="[0, 0, -10]">
			@for (position of positions(); track position.id) {
				<ngt-mesh [position]="position.position">
					<ngt-icosahedron-geometry *args="[1, 1]" />
					<ngt-mesh-basic-material color="white" wireframe />
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
	decorators: storyDecorators(),
};

export const Default = storyFunction(DefaultPerspectiveCameraStory);
