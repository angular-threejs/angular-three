import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, viewChild } from '@angular/core';

@Component({
	standalone: true,
	template: `
		@if (solid()) {
			<ngt-spot-light [position]="35" [intensity]="2 * Math.PI" [decay]="0" />
		}

		<ngts-rounded-box
			[options]="{ width: width(), height: height(), depth: depth(), radius: radius(), smoothness: smoothness() }"
		>
			<ngt-mesh-phong-material color="#f3f3f3" [wireframe]="!solid()" />
		</ngts-rounded-box>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsRoundedBox],
})
class DefaultRoundedBoxStory {
	width = input(25);
	height = input(25);
	depth = input(25);
	radius = input(1);
	smoothness = input(5);
	solid = input(false);

	roundedBox = viewChild.required(NgtsRoundedBox);

	constructor() {
		injectTurnable(() => this.roundedBox().meshRef());
	}

	protected readonly Math = Math;
}

import { Meta } from '@storybook/angular';
import { NgtsRoundedBox } from 'angular-three-soba/abstractions';
import { injectTurnable, makeDecorators, makeStoryObject, number } from '../setup-canvas';

export default {
	title: 'Abstractions/RoundedBox',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultRoundedBoxStory, {
	canvasOptions: { camera: { position: [-30, 30, 30] } },
	argsOptions: {
		width: number(25, { range: true, min: 1, max: 100, step: 1 }),
		height: number(25, { range: true, min: 1, max: 100, step: 1 }),
		depth: number(25, { range: true, min: 1, max: 100, step: 1 }),
		radius: number(1, { range: true, min: 0, max: 10, step: 0.1 }),
		smoothness: number(5, { range: true, min: 0, max: 10, step: 0.1 }),
		solid: false,
	},
});

export const Solid = makeStoryObject(DefaultRoundedBoxStory, {
	canvasOptions: { camera: { position: [-30, 30, 30] } },
	argsOptions: {
		width: number(25, { range: true, min: 1, max: 100, step: 1 }),
		height: number(25, { range: true, min: 1, max: 100, step: 1 }),
		depth: number(25, { range: true, min: 1, max: 100, step: 1 }),
		radius: number(8, { range: true, min: 0, max: 10, step: 0.1 }),
		smoothness: number(5, { range: true, min: 0, max: 10, step: 0.1 }),
		solid: true,
	},
});
