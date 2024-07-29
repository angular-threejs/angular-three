import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, NgtArgs, NgtVector3, omit, pick, resolveRef, vector3 } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { ColorRepresentation, Vector2 } from 'three';
import { Line2, LineMaterial, LineMaterialParameters, LineSegmentsGeometry } from 'three-stdlib';
import { SegmentObject } from './segment-object';

@Component({
	selector: 'ngts-segment',
	standalone: true,
	template: `
		<ngt-segment-object #segment [color]="color()" [start]="normalizedStart()" [end]="normalizedEnd()" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSegment {
	start = input.required<NgtVector3>();
	end = input.required<NgtVector3>();
	color = input<ColorRepresentation>();

	normalizedStart = vector3(this.start);
	normalizedEnd = vector3(this.end);

	segmentRef = viewChild.required<ElementRef<SegmentObject>>('segment');

	segments = inject(NgtsSegments);

	constructor() {
		extend({ SegmentObject });
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				return this.segments.subscribe(this.segmentRef());
			});
		});
	}
}

export interface NgtsSegmentsOptions extends LineMaterialParameters {
	limit: number;
	lineWidth: number;
}

const defaultSegmentsOptions: NgtsSegmentsOptions = {
	limit: 1000,
	lineWidth: 1.0,
};

@Component({
	selector: 'ngts-segments',
	standalone: true,
	template: `
		<ngt-primitive #line *args="[line]">
			<ngt-primitive *args="[geometry]" attach="geometry" />
			<ngt-primitive *args="[material]" attach="material" [parameters]="materialParameters()" />
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsSegments {
	options = input(defaultSegmentsOptions, { transform: mergeInputs(defaultSegmentsOptions) });
	parameters = omit(this.options, ['limit', 'lineWidth']);

	private lineWidth = pick(this.options, 'lineWidth');
	private limit = pick(this.options, 'limit');

	lineRef = viewChild<ElementRef<Line2>>('line');

	segments: Array<ElementRef<SegmentObject> | SegmentObject> = [];

	line = new Line2();
	material = new LineMaterial();
	geometry = new LineSegmentsGeometry();
	resolution = new Vector2(512, 512);

	materialParameters = computed(() => ({
		vertexColors: true,
		resolution: this.resolution,
		linewidth: this.lineWidth(),
		...this.parameters(),
	}));

	positions = computed(() => {
		const limit = this.limit();
		return Array.from({ length: limit * 6 }, () => 0);
	});
	colors = computed(() => {
		const limit = this.limit();
		return Array.from({ length: limit * 6 }, () => 0);
	});

	constructor() {
		injectBeforeRender(() => {
			const [limit, positions, colors] = [this.limit(), this.positions(), this.colors()];

			for (let i = 0; i < limit; i++) {
				const segment = resolveRef(this.segments[i]);
				if (segment) {
					positions[i * 6 + 0] = segment.start.x;
					positions[i * 6 + 1] = segment.start.y;
					positions[i * 6 + 2] = segment.start.z;

					positions[i * 6 + 3] = segment.end.x;
					positions[i * 6 + 4] = segment.end.y;
					positions[i * 6 + 5] = segment.end.z;

					colors[i * 6 + 0] = segment.color.r;
					colors[i * 6 + 1] = segment.color.g;
					colors[i * 6 + 2] = segment.color.b;

					colors[i * 6 + 3] = segment.color.r;
					colors[i * 6 + 4] = segment.color.g;
					colors[i * 6 + 5] = segment.color.b;
				}
			}

			this.geometry.setColors(colors);
			this.geometry.setPositions(positions);
			this.line.computeLineDistances();
		});
	}

	subscribe(ref: ElementRef<SegmentObject> | SegmentObject) {
		this.segments.push(ref);
		return () => {
			this.segments = this.segments.filter((i) => i !== ref);
		};
	}
}
