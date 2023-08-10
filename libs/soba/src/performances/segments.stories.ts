import { NgFor } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { injectBeforeRender, injectNgtRef } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsSegment, NgtsSegments, type SegmentObject } from 'angular-three-soba/performances';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-segments [limit]="10_000" [lineWidth]="0.1">
			<ngts-segment
				*ngFor="let ref of refs"
				color="orange"
				[segmentRef]="ref"
				[start]="[0, 0, 0]"
				[end]="[0, 0, 0]"
			/>
		</ngts-segments>
		<ngts-orbit-controls />
	`,
	imports: [NgtsOrbitControls, NgtsSegment, NgtsSegments, NgFor],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class PerformanceSegmentsStory {
	refs = Array.from({ length: 10_000 }, () => injectNgtRef<SegmentObject>());

	constructor() {
		injectBeforeRender(({ clock }) => {
			this.refs.forEach((ref, i) => {
				const time = clock.elapsedTime;
				const x = Math.sin((i / 5000) * Math.PI) * 10;
				const y = Math.cos((i / 5000) * Math.PI) * 10;
				const z = Math.cos((i * time) / 1000);
				ref.nativeElement.start.set(x, y, z);
				ref.nativeElement.end.set(x + Math.sin(time + i), y + Math.cos(time + i), z);
				ref.nativeElement.color.setRGB(x / 10, y / 10, z);
			});
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-segments [limit]="6" [lineWidth]="2">
			<ngts-segment [start]="[0, 0, 0]" [end]="[10, 0, 0]" color="red" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, 10, 0]" color="blue" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, 0, 10]" color="green" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[-10, 0, 0]" [color]="[1, 0, 0]" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, -10, 0]" [color]="[0, 1, 0]" />
			<ngts-segment [start]="[0, 0, 0]" [end]="[0, 0, -10]" [color]="[1, 1, 0]" />
		</ngts-segments>
		<ngts-orbit-controls />
	`,
	imports: [NgtsSegments, NgtsSegment, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class BasicSegmentsStory {}

export default {
	title: 'Performance/Segments',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({
	camera: { position: [10, 10, 10] },
	controls: false,
});

export const Basic = makeStoryFunction(BasicSegmentsStory, canvasOptions);
export const Performance = makeStoryFunction(PerformanceSegmentsStory, canvasOptions);
