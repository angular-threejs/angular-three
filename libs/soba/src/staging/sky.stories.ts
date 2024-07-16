import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsSky, NgtsSkyOptions } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-sky [options]="options()" />
		<ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[100, 100, 4, 4]" />
			<ngt-mesh-basic-material color="black" [wireframe]="true" />
		</ngt-mesh>
		<ngt-axes-helper />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsSky, NgtArgs],
})
class DefaultSkyStory {
	protected readonly Math = Math;
	options = input({} as NgtsSkyOptions);
}

export default {
	title: 'Staging/Sky',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultSkyStory, {
	argsOptions: {
		options: {
			turbidity: number(8, { min: 0, max: 10, step: 0.1 }),
			rayleigh: number(6, { min: 0, max: 10, step: 0.1 }),
			mieCoefficient: number(0.005, { min: 0, max: 0.1, step: 0.001 }),
			mieDirectionalG: number(0.8, { min: 0, max: 1, step: 0.01 }),
			sunPosition: [1, 0, 0],
		},
	},
});

export const CustomAngles = makeStoryObject(DefaultSkyStory, {
	argsOptions: {
		options: {
			distance: 3000,
			turbidity: number(8, { min: 0, max: 10, step: 0.1 }),
			rayleigh: number(6, { min: 0, max: 10, step: 0.1 }),
			mieCoefficient: number(0.005, { min: 0, max: 0.1, step: 0.001 }),
			mieDirectionalG: number(0.8, { min: 0, max: 1, step: 0.01 }),
			inclination: number(0.49, { min: 0, max: 1, step: 0.01 }),
			azimuth: number(0.25, { min: 0, max: 1, step: 0.01 }),
		},
	},
});
