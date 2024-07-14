import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import {
	NgtsCatmullRomLine,
	NgtsCatmullRomLineOptions,
	NgtsCubicBezierLine,
	NgtsCubicBezierLineOptions,
	NgtsLine,
	NgtsLineOptions,
	NgtsQuadraticBezierLine,
	NgtsQuadraticBezierLineOptions,
} from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Vector3 } from 'three';
import { GeometryUtils } from 'three-stdlib';
import { color, makeDecorators, makeStoryObject, number, select } from '../setup-canvas';

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [number, number, number][];
const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
	number,
	number,
	number,
][];
const catPoints = [
	[0, 0, 0] as [number, number, number],
	[-8, 6, -5] as [number, number, number],
	[-2, 3, 7] as [number, number, number],
	[6, 4.5, 3] as [number, number, number],
	[0.5, 8, -1] as [number, number, number],
];

@Component({
	standalone: true,
	template: `
		<ngts-catmull-rom-line [points]="points" [options]="options()" />
		<ngts-orbit-controls [options]="{ zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCatmullRomLine, NgtsOrbitControls],
})
class CatmullRomLineStory {
	points = catPoints;
	options = input({} as NgtsCatmullRomLineOptions);
}

@Component({
	standalone: true,
	template: `
		<ngts-cubic-bezier-line [start]="start()" [end]="end()" [midA]="midA()" [midB]="midB()" [options]="options()" />
		<ngts-orbit-controls [options]="{ zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtsCubicBezierLine, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class CubicLineStory {
	start = input<Vector3 | [number, number, number]>([0, 0, 0]);
	end = input<Vector3 | [number, number, number]>([10, 0, 0]);
	midA = input<Vector3 | [number, number, number]>([5, 4, 0]);
	midB = input<Vector3 | [number, number, number]>([0, 0, 5]);

	options = input({} as NgtsCubicBezierLineOptions);
}

@Component({
	standalone: true,
	template: `
		<ngts-quadratic-bezier-line [start]="start()" [end]="end()" [options]="options()" />
		<ngts-orbit-controls [options]="{ zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtsQuadraticBezierLine, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class QuadraticLineStory {
	start = input<Vector3 | [number, number, number]>([0, 0, 0]);
	end = input<Vector3 | [number, number, number]>([4, 7, 5]);
	options = input({} as NgtsQuadraticBezierLineOptions);
}

@Component({
	standalone: true,
	template: `
		<ngts-line [points]="points" [options]="options()" />
		<ngts-orbit-controls [options]="{ zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine, NgtsOrbitControls],
})
class BasicLineStory {
	points = points;
	options = input({} as NgtsLineOptions);
}

export default {
	title: 'Abstractions/Line',
	decorators: makeDecorators(),
} as Meta;

// <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>

export const Basic = makeStoryObject(BasicLineStory, {
	canvasOptions: { camera: { position: [0, 0, 17] }, controls: false },
	argsOptions: {
		options: {
			color: color('red'),
			lineWidth: 3,
			dashed: false,
			segments: false,
		},
	},
});

export const VertexColors = makeStoryObject(BasicLineStory, {
	canvasOptions: { camera: { position: [0, 0, 17] }, controls: false },
	argsOptions: {
		options: {
			lineWidth: 3,
			dashed: false,
			segments: false,
			vertexColors: colors,
		},
	},
});

export const QuadraticBezier = makeStoryObject(QuadraticLineStory, {
	canvasOptions: { camera: { position: [0, 0, 17] }, controls: false },
	argsOptions: {
		start: [0, 0, 0],
		end: [4, 7, 5],
		options: {
			color: color('red'),
			lineWidth: 2,
			dashed: true,
		},
	},
});

export const CubicBezier = makeStoryObject(CubicLineStory, {
	canvasOptions: { camera: { position: [0, 0, 17] }, controls: false },
	argsOptions: {
		start: [0, 0, 0],
		end: [10, 0, 0],
		midA: [5, 4, 0],
		midB: [0, 0, 5],
		options: {
			color: color('red'),
			lineWidth: 2,
			dashed: true,
		},
	},
});

export const CatmullRom = makeStoryObject(CatmullRomLineStory, {
	canvasOptions: { camera: { position: [0, 0, 17] }, controls: false },
	argsOptions: {
		options: {
			closed: false,
			curveType: select('centripetal', { options: ['centripetal', 'chordal', 'catmullrom'] }),
			color: color('red'),
			lineWidth: 3,
			dashed: true,
			tension: number(0.5, { range: true, min: 0, max: 1, step: 0.01 }),
			segments: number(20, { range: true, min: 1, max: 20, step: 1 }),
		},
	},
});
