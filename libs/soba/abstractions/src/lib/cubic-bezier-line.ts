import { ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { is, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { NgtsLine, NgtsLineOptions } from './line';

/**
 * Configuration options for the NgtsCubicBezierLine component.
 */
export interface NgtsCubicBezierLineOptions extends Omit<NgtsLineOptions, 'segments'> {
	/**
	 * Number of segments to divide the Bezier curve into for rendering.
	 * @default 20
	 */
	segments?: number;
}

const defaultOptions: NgtsCubicBezierLineOptions = {
	lineWidth: 1,
	segments: 20,
};

/**
 * A line component that renders a cubic Bezier curve defined by start, end, and two control points.
 * Uses THREE.CubicBezierCurve3 internally for smooth curve interpolation.
 *
 * @example
 * ```html
 * <ngts-cubic-bezier-line
 *   [start]="[0, 0, 0]"
 *   [end]="[10, 0, 0]"
 *   [midA]="[2, 5, 0]"
 *   [midB]="[8, 5, 0]"
 *   [options]="{ color: 'red', lineWidth: 2 }"
 * />
 * ```
 */
@Component({
	selector: 'ngts-cubic-bezier-line',
	template: `
		<ngts-line [points]="points()" [options]="parameters()">
			<ng-content />
		</ngts-line>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine],
})
export class NgtsCubicBezierLine {
	start = input.required<THREE.Vector3 | [number, number, number]>();
	end = input.required<THREE.Vector3 | [number, number, number]>();
	midA = input.required<THREE.Vector3 | [number, number, number]>();
	midB = input.required<THREE.Vector3 | [number, number, number]>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['segments']);

	line = viewChild.required(NgtsLine);

	private segments = pick(this.options, 'segments');

	protected points = computed(() => {
		const [start, end, midA, midB, segments] = [
			this.start(),
			this.end(),
			this.midA(),
			this.midB(),
			this.segments(),
		];
		const startV = is.three<THREE.Vector3>(start, 'isVector3') ? start : new THREE.Vector3(...start);
		const endV = is.three<THREE.Vector3>(end, 'isVector3') ? end : new THREE.Vector3(...end);
		const midAV = is.three<THREE.Vector3>(midA, 'isVector3') ? midA : new THREE.Vector3(...midA);
		const midBV = is.three<THREE.Vector3>(midB, 'isVector3') ? midB : new THREE.Vector3(...midB);
		return new THREE.CubicBezierCurve3(startV, midAV, midBV, endV).getPoints(segments);
	});
}
