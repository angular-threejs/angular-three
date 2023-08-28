import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsStars } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[100, 100, 4, 4]" />
			<ngt-mesh-basic-material color="white" [wireframe]="true" />
		</ngt-mesh>
		<ngt-axes-helper />
		<ngts-stars />
	`,
	imports: [NgtsStars, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultStarsStory {
	Math = Math;
}

export default {
	title: 'Staging/Stars',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultStarsStory);
