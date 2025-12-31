import { ChangeDetectionStrategy, Component, computed, input, untracked, viewChild } from '@angular/core';
import { is, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { NgtsLine, NgtsLineOptions } from './line';

/**
 * Configuration options for the NgtsCatmullRomLine component.
 */
export interface NgtsCatmullRomLineOptions extends Omit<NgtsLineOptions, 'segments'> {
	/**
	 * The type of Catmull-Rom curve interpolation.
	 * - 'centripetal': Produces smoother curves, avoids cusps and self-intersections
	 * - 'chordal': Uses chord length parameterization
	 * - 'catmullrom': Standard Catmull-Rom spline
	 * @default 'centripetal'
	 */
	curveType: 'centripetal' | 'chordal' | 'catmullrom';
	/**
	 * Tension parameter for the curve (0 to 1). Higher values create tighter curves.
	 * @default 0.5
	 */
	tension: number;
	/**
	 * Number of segments to divide the curve into for rendering.
	 * @default 20
	 */
	segments: number;
	/**
	 * Whether the curve should be closed (connect end to start).
	 * @default false
	 */
	closed: boolean;
}

const defaultOptions: NgtsCatmullRomLineOptions = {
	curveType: 'centripetal',
	tension: 0.5,
	segments: 20,
	closed: false,
	lineWidth: 1,
};

/**
 * A line component that renders a smooth Catmull-Rom spline curve through given points.
 * Supports vertex color interpolation and various curve parameterizations.
 *
 * @example
 * ```html
 * <ngts-catmull-rom-line
 *   [points]="[[0, 0, 0], [1, 2, 0], [3, 1, 0], [4, 0, 0]]"
 *   [options]="{ curveType: 'centripetal', tension: 0.5, closed: false, color: 'hotpink' }"
 * />
 * ```
 */
@Component({
	selector: 'ngts-catmull-rom-line',
	template: `
		<ngts-line [points]="segmentedPoints()" [options]="lineOptions()">
			<ng-content />
		</ngts-line>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine],
})
export class NgtsCatmullRomLine {
	points = input.required<Array<THREE.Vector3 | [number, number, number]>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	private parameters = omit(this.options, ['curveType', 'tension', 'segments', 'closed', 'vertexColors']);

	line = viewChild.required(NgtsLine);

	private closed = pick(this.options, 'closed');
	private curveType = pick(this.options, 'curveType');
	private tension = pick(this.options, 'tension');
	private segments = pick(this.options, 'segments');
	private vertexColors = pick(this.options, 'vertexColors');

	private curve = computed(() => {
		const [points, closed, curveType, tension] = [this.points(), this.closed(), this.curveType(), this.tension()];

		const mappedPoints = points.map((pt) =>
			is.three<THREE.Vector3>(pt, 'isVector3') ? pt : new THREE.Vector3(...(pt as [number, number, number])),
		);

		return new THREE.CatmullRomCurve3(mappedPoints, closed, curveType, tension);
	});

	protected segmentedPoints = computed(() => {
		const [curve, segments] = [this.curve(), this.segments()];
		return curve.getPoints(segments);
	});

	private interpolatedVertexColors = computed(() => {
		const [vertexColors, segments] = [this.vertexColors(), this.segments()];
		if (!vertexColors || vertexColors.length < 2) return undefined;

		if (vertexColors.length === segments + 1) return vertexColors;

		const mappedColors = vertexColors.map((color) =>
			is.three<THREE.Color>(color, 'isColor') ? color : new THREE.Color(...(color as [number, number, number])),
		);
		if (untracked(this.closed)) mappedColors.push(mappedColors[0].clone());

		const iColors: THREE.Color[] = [mappedColors[0]];
		const divisions = segments / (mappedColors.length - 1);
		for (let i = 1; i < segments; i++) {
			const alpha = (i % divisions) / divisions;
			const colorIndex = Math.floor(i / divisions);
			iColors.push(mappedColors[colorIndex].clone().lerp(mappedColors[colorIndex + 1], alpha));
		}
		iColors.push(mappedColors[mappedColors.length - 1]);

		return iColors;
	});

	protected lineOptions = computed(() => ({ ...this.parameters(), vertexColors: this.interpolatedVertexColors() }));
}
