import { ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { is, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { NgtsLine, NgtsLineOptions } from './line';

/**
 * Configuration options for the NgtsQuadraticBezierLine component.
 * Extends NgtsLineOptions but replaces boolean 'segments' with a number for curve resolution.
 */
export interface NgtsQuadraticBezierLineOptions extends Omit<NgtsLineOptions, 'segments'> {
	/**
	 * Number of segments used to approximate the quadratic bezier curve.
	 * Higher values produce smoother curves.
	 * @default 20
	 */
	segments?: number;
}

const defaultOptions: NgtsQuadraticBezierLineOptions = {
	lineWidth: 1,
	segments: 20,
};

/**
 * A component for rendering quadratic bezier curves as lines.
 * Creates smooth curves between start and end points with an optional control point.
 *
 * @example
 * ```html
 * <ngts-quadratic-bezier-line
 *   [start]="[0, 0, 0]"
 *   [end]="[2, 2, 0]"
 *   [options]="{ color: 'blue', lineWidth: 2 }"
 * />
 * ```
 *
 * @example
 * ```html
 * <!-- With custom midpoint control -->
 * <ngts-quadratic-bezier-line
 *   [start]="[0, 0, 0]"
 *   [end]="[2, 0, 0]"
 *   [mid]="[1, 2, 0]"
 *   [options]="{ segments: 50 }"
 * />
 * ```
 */
@Component({
	selector: 'ngts-quadratic-bezier-line',
	template: `
		<ngts-line [points]="points()" [options]="parameters()">
			<ng-content />
		</ngts-line>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine],
})
export class NgtsQuadraticBezierLine {
	/**
	 * Starting point of the bezier curve.
	 * @default [0, 0, 0]
	 */
	start = input<THREE.Vector3 | [number, number, number]>([0, 0, 0]);

	/**
	 * Ending point of the bezier curve.
	 * @default [0, 0, 0]
	 */
	end = input<THREE.Vector3 | [number, number, number]>([0, 0, 0]);

	/**
	 * Control point for the quadratic bezier curve.
	 * If not provided, automatically calculated based on start and end points.
	 */
	mid = input<THREE.Vector3 | [number, number, number]>();

	/**
	 * Configuration options for the line appearance.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected parameters = omit(this.options, ['segments']);

	private segments = pick(this.options, 'segments');

	/**
	 * Reference to the underlying NgtsLine component.
	 */
	line = viewChild.required(NgtsLine);

	protected points = computed(() => this.getPoints(this.start(), this.end(), this.mid(), this.segments()));

	private curve = new THREE.QuadraticBezierCurve3();

	/**
	 * Imperatively updates the bezier curve points.
	 * Useful for animations or dynamic updates without triggering full re-renders.
	 *
	 * @param start - Starting point of the curve
	 * @param end - Ending point of the curve
	 * @param mid - Optional control point for the curve
	 */
	setPoints(
		start: THREE.Vector3 | [number, number, number],
		end: THREE.Vector3 | [number, number, number],
		mid?: THREE.Vector3 | [number, number, number],
	) {
		const points = this.getPoints(start, end, mid);
		const geometry = this.line().lineGeometry();
		if (geometry) geometry.setPositions(points.map((p) => p.toArray()).flat());
	}

	private getPoints(
		start: THREE.Vector3 | [number, number, number],
		end: THREE.Vector3 | [number, number, number],
		mid?: THREE.Vector3 | [number, number, number],
		segments = 20,
	) {
		if (is.three<THREE.Vector3>(start, 'isVector3')) this.curve.v0.copy(start);
		else this.curve.v0.set(...(start as [number, number, number]));
		if (is.three<THREE.Vector3>(end, 'isVector3')) this.curve.v2.copy(end);
		else this.curve.v2.set(...(end as [number, number, number]));
		if (is.three<THREE.Vector3>(mid, 'isVector3')) {
			this.curve.v1.copy(mid);
		} else if (Array.isArray(mid)) {
			this.curve.v1.set(...(mid as [number, number, number]));
		} else {
			this.curve.v1.copy(
				this.curve.v0
					.clone()
					.add(this.curve.v2.clone().sub(this.curve.v0))
					.add(new THREE.Vector3(0, this.curve.v0.y - this.curve.v2.y, 0)),
			);
		}
		return this.curve.getPoints(segments);
	}
}
