import { ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { is, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { NgtsLine, NgtsLineOptions } from './line';

export interface NgtsQuadraticBezierLineOptions extends Omit<NgtsLineOptions, 'segments'> {
	segments?: number;
}

const defaultOptions: NgtsQuadraticBezierLineOptions = {
	lineWidth: 1,
	segments: 20,
};

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
	start = input<THREE.Vector3 | [number, number, number]>([0, 0, 0]);
	end = input<THREE.Vector3 | [number, number, number]>([0, 0, 0]);
	mid = input<THREE.Vector3 | [number, number, number]>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['segments']);

	private segments = pick(this.options, 'segments');

	line = viewChild.required(NgtsLine);

	protected points = computed(() => this.getPoints(this.start(), this.end(), this.mid(), this.segments()));

	private curve = new THREE.QuadraticBezierCurve3();

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
