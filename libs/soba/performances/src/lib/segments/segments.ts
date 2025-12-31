import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, NgtArgs, NgtVector3, omit, pick, resolveRef, vector3 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Line2, LineMaterial, LineMaterialParameters, LineSegmentsGeometry } from 'three-stdlib';
import { SegmentObject } from './segment-object';

/**
 * A component representing a single line segment within an NgtsSegments container.
 *
 * Each NgtsSegment defines a line from a start point to an end point with an optional color.
 * Segments are rendered efficiently using a single draw call via the parent NgtsSegments.
 *
 * @example
 * ```html
 * <ngts-segments>
 *   <ngts-segment [start]="[0, 0, 0]" [end]="[1, 1, 1]" [color]="'red'" />
 *   <ngts-segment [start]="[1, 1, 1]" [end]="[2, 0, 0]" [color]="'blue'" />
 * </ngts-segments>
 * ```
 */
@Component({
	selector: 'ngts-segment',
	template: `
		<ngt-segment-object #segment [color]="color()" [start]="normalizedStart()" [end]="normalizedEnd()" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSegment {
	/**
	 * The starting point of the line segment.
	 * Accepts a Vector3-like value: [x, y, z], {x, y, z}, or THREE.Vector3.
	 */
	start = input.required<NgtVector3>();
	/**
	 * The ending point of the line segment.
	 * Accepts a Vector3-like value: [x, y, z], {x, y, z}, or THREE.Vector3.
	 */
	end = input.required<NgtVector3>();
	/**
	 * The color of the line segment.
	 * If not specified, inherits from the parent or defaults to white.
	 */
	color = input<THREE.ColorRepresentation>();

	/** @internal */
	protected normalizedStart = vector3(this.start);
	/** @internal */
	protected normalizedEnd = vector3(this.end);

	/**
	 * Reference to the underlying SegmentObject element.
	 */
	segmentRef = viewChild.required<ElementRef<SegmentObject>>('segment');

	private segments = inject(NgtsSegments);

	constructor() {
		extend({ SegmentObject });

		effect((onCleanup) => {
			const cleanUp = this.segments.subscribe(this.segmentRef());
			onCleanup(() => cleanUp());
		});
	}
}

/**
 * Configuration options for the NgtsSegments component.
 * Extends LineMaterialParameters to allow customization of line appearance.
 */
export interface NgtsSegmentsOptions extends LineMaterialParameters {
	/**
	 * The maximum number of segments that can be rendered.
	 * This determines the size of the position and color buffers.
	 * @default 1000
	 */
	limit: number;
	/**
	 * The width of the line segments in world units.
	 * @default 1.0
	 */
	lineWidth: number;
}

const defaultSegmentsOptions: NgtsSegmentsOptions = {
	limit: 1000,
	lineWidth: 1.0,
};

/**
 * A component that efficiently renders multiple line segments.
 *
 * This component uses Line2 from three-stdlib to render line segments with
 * configurable width and color. All segments are batched into a single draw call
 * for optimal performance.
 *
 * Add NgtsSegment children to define individual line segments.
 *
 * @example
 * ```html
 * <ngts-segments [options]="{ lineWidth: 2, limit: 100 }">
 *   <ngts-segment [start]="[0, 0, 0]" [end]="[1, 1, 1]" [color]="'red'" />
 *   <ngts-segment [start]="[1, 1, 1]" [end]="[2, 0, 0]" [color]="'blue'" />
 * </ngts-segments>
 * ```
 */
@Component({
	selector: 'ngts-segments',
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
	/**
	 * Configuration options for the segments rendering.
	 */
	options = input(defaultSegmentsOptions, { transform: mergeInputs(defaultSegmentsOptions) });
	private parameters = omit(this.options, ['limit', 'lineWidth']);

	private lineWidth = pick(this.options, 'lineWidth');
	private limit = pick(this.options, 'limit');

	/**
	 * Reference to the underlying Line2 element.
	 */
	lineRef = viewChild<ElementRef<Line2>>('line');

	/**
	 * Array of registered segment references. Used internally to track all segments.
	 */
	segments: Array<ElementRef<SegmentObject> | SegmentObject> = [];

	/** @internal */
	protected line = new Line2();
	/** @internal */
	protected material = new LineMaterial();
	/** @internal */
	protected geometry = new LineSegmentsGeometry();
	private resolution = new THREE.Vector2(512, 512);

	/** @internal */
	protected materialParameters = computed(() => ({
		vertexColors: true,
		resolution: this.resolution,
		linewidth: this.lineWidth(),
		...this.parameters(),
	}));

	/** @internal */
	private positions = computed(() => {
		const limit = this.limit();
		return Array.from({ length: limit * 6 }, () => 0);
	});

	/** @internal */
	private colors = computed(() => {
		const limit = this.limit();
		return Array.from({ length: limit * 6 }, () => 0);
	});

	constructor() {
		beforeRender(() => {
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

	/**
	 * Registers a segment with this container.
	 *
	 * @param ref - The SegmentObject reference or element to register
	 * @returns A cleanup function to unregister the segment
	 */
	subscribe(ref: ElementRef<SegmentObject> | SegmentObject) {
		this.segments.push(ref);
		return () => {
			this.segments = this.segments.filter((i) => i !== ref);
		};
	}
}
