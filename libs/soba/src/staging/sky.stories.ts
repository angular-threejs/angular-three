import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, signal } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, injectBeforeRender } from 'angular-three';
import { NgtsSky } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-sky
			[distance]="3000"
			[turbidity]="turbidity"
			[rayleigh]="rayleigh"
			[mieCoefficient]="mieCoefficient"
			[mieDirectionalG]="mieDirectionalG"
			[inclination]="inclination()"
			[azimuth]="azimuth"
		/>
		<ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[100, 100, 4, 4]" />
			<ngt-mesh-basic-material color="black" [wireframe]="true" />
		</ngt-mesh>
		<ngt-axes-helper />
	`,
	imports: [NgtsSky, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class RotationSkyStory {
	readonly Math = Math;
	@Input() turbidity = 8;
	@Input() rayleigh = 6;
	@Input() mieCoefficient = 0.005;
	@Input() mieDirectionalG = 0.8;
	@Input() azimuth = 0.25;

	readonly inclination = signal(0);

	constructor() {
		injectBeforeRender(() => {
			this.inclination.update((prev) => prev + 0.0015);
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-sky
			[distance]="3000"
			[turbidity]="turbidity"
			[rayleigh]="rayleigh"
			[mieCoefficient]="mieCoefficient"
			[mieDirectionalG]="mieDirectionalG"
			[inclination]="inclination"
			[azimuth]="azimuth"
		/>
		<ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[100, 100, 4, 4]" />
			<ngt-mesh-basic-material color="black" [wireframe]="true" />
		</ngt-mesh>
		<ngt-axes-helper />
	`,
	imports: [NgtsSky, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class CustomAnglesSkyStory {
	readonly Math = Math;
	@Input() turbidity = 8;
	@Input() rayleigh = 6;
	@Input() mieCoefficient = 0.005;
	@Input() mieDirectionalG = 0.8;
	@Input() inclination = 0.49;
	@Input() azimuth = 0.25;
}

@Component({
	standalone: true,
	template: `
		<ngts-sky
			[turbidity]="turbidity"
			[rayleigh]="rayleigh"
			[mieCoefficient]="mieCoefficient"
			[mieDirectionalG]="mieDirectionalG"
			[sunPosition]="[sunPositionX, sunPositionY, sunPositionZ]"
		/>
		<ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[100, 100, 4, 4]" />
			<ngt-mesh-basic-material color="black" [wireframe]="true" />
		</ngt-mesh>
		<ngt-axes-helper />
	`,
	imports: [NgtsSky, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultSkyStory {
	readonly Math = Math;
	@Input() turbidity = 8;
	@Input() rayleigh = 6;
	@Input() mieCoefficient = 0.005;
	@Input() mieDirectionalG = 0.8;
	@Input() sunPositionX = 1;
	@Input() sunPositionY = 0;
	@Input() sunPositionZ = 0;
}

export default {
	title: 'Staging/Sky',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultSkyStory, {
	argsOptions: {
		turbidity: number(8, { min: 0, max: 10, step: 0.1, range: true }),
		rayleigh: number(6, { min: 0, max: 10, step: 0.1, range: true }),
		mieCoefficient: number(0.005, { min: 0, max: 0.1, step: 0.001, range: true }),
		mieDirectionalG: number(0.8, { min: 0, max: 1, step: 0.01, range: true }),
		sunPositionX: number(1),
		sunPositionY: number(0),
		sunPositionZ: number(0),
	},
});

export const CustomAngles = makeStoryObject(CustomAnglesSkyStory, {
	argsOptions: {
		turbidity: number(8, { min: 0, max: 10, step: 0.1, range: true }),
		rayleigh: number(6, { min: 0, max: 10, step: 0.1, range: true }),
		mieCoefficient: number(0.005, { min: 0, max: 0.1, step: 0.001, range: true }),
		mieDirectionalG: number(0.8, { min: 0, max: 1, step: 0.01, range: true }),
		inclination: number(0.49, { min: 0, max: 1, step: 0.01, range: true }),
		azimuth: number(0.25, { min: 0, max: 1, step: 0.01, range: true }),
	},
});

export const Rotation = makeStoryObject(RotationSkyStory, {
	argsOptions: {
		turbidity: number(8, { min: 0, max: 10, step: 0.1, range: true }),
		rayleigh: number(6, { min: 0, max: 10, step: 0.1, range: true }),
		mieCoefficient: number(0.005, { min: 0, max: 0.1, step: 0.001, range: true }),
		mieDirectionalG: number(0.8, { min: 0, max: 1, step: 0.01, range: true }),
		azimuth: number(0.25, { min: 0, max: 1, step: 0.01, range: true }),
	},
});
