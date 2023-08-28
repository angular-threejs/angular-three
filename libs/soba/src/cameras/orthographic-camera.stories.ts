import { NgFor } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, type TrackByFunction } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrthographicCamera } from 'angular-three-soba/cameras';
import { makeDecorators, makeStoryObject } from '../setup-canvas';
import { positions, type Position } from './positions';

@Component({
	standalone: true,
	template: `
		<ngts-orthographic-camera [makeDefault]="true" [position]="[0, 0, 10]" [zoom]="40" />

		<ngt-group [position]="[0, 0, -10]">
			<ngt-mesh *ngFor="let position of positions(); trackBy: trackBy" [position]="position.position">
				<ngt-icosahedron-geometry *args="[1, 1]" />
				<ngt-mesh-basic-material color="white" [wireframe]="true" />
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgtsOrthographicCamera, NgFor, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultOrthographicCameraStory {
	positions = positions;
	trackBy: TrackByFunction<Position> = (_, item) => item.id;
}

export default {
	title: 'Camera/OrthographicCamera',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultOrthographicCameraStory);
