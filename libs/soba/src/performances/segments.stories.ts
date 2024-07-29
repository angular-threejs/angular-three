import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, viewChildren } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsSegment, NgtsSegments } from 'angular-three-soba/performances';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-segments [options]="{ limit: limit(), lineWidth: lineWidth() }">
			@for (index of count; track $index) {
				<ngts-segment [start]="[0, 0, 0]" [end]="[0, 0, 0]" [color]="'orange'" />
			}
		</ngts-segments>
		<ngts-orbit-controls />
	`,
	imports: [NgtsSegments, NgtsSegment, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class PerformanceSegmentsStory {
	limit = input(10000);
	lineWidth = input(0.1);

	count = Array.from({ length: 10000 }).map((_, i) => i);

	segmentsRef = viewChildren(NgtsSegment);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const segments = this.segmentsRef();
			segments.forEach((segment, index) => {
				const segmentObject = segment.segmentRef().nativeElement;

				const time = clock.elapsedTime;
				const x = Math.sin((index / 5000) * Math.PI) * 10;
				const y = Math.cos((index / 5000) * Math.PI) * 10;
				const z = Math.cos((index * time) / 1000);
				segmentObject.start.set(x, y, z);
				segmentObject.end.set(x + Math.sin(time + index), y + Math.cos(time + index), z);
				segmentObject.color.setRGB(x / 10, y / 10, z);
			});
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-segments [options]="{ limit: limit(), lineWidth: lineWidth() }">
			<ngts-segment [start]="[0, 0, 0]" [end]="[10, 0, 0]" [color]="'red'" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, 10, 0]" [color]="'blue'" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, 0, 10]" [color]="'green'" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[-10, 0, 0]" [color]="'rgb(255, 0, 0)'" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, -10, 0]" [color]="'rgb(0, 255, 0)'" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, 0, -10]" [color]="'rgb(0, 0, 255)'" />
		</ngts-segments>
		<ngts-orbit-controls />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsSegments, NgtsSegment, NgtsOrbitControls],
})
class BasicSegmentsStory {
	limit = input(6);
	lineWidth = input(2.0);
}

export default {
	title: 'Performances/Segments',
	decorators: makeDecorators(),
} as Meta;

export const BasicSegments = makeStoryObject(BasicSegmentsStory, {
	canvasOptions: { camera: { position: [10, 10, 10] }, controls: false },
	argsOptions: {
		limit: number(6, { range: true, min: 1, max: 100, step: 1 }),
		lineWidth: number(2.0, { range: true, min: 0.1, max: 10, step: 0.1 }),
	},
});

export const PerformanceSegments = makeStoryObject(PerformanceSegmentsStory, {
	canvasOptions: { camera: { position: [10, 10, 10] }, controls: false },
	argsOptions: {
		limit: number(10000, { range: true, min: 1, max: 10000, step: 1 }),
		lineWidth: number(0.1, { range: true, min: 0.1, max: 10, step: 0.1 }),
	},
});
