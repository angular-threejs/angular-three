import { ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { QuadraticBezierCurve3, Vector3 } from 'three';
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
	standalone: true,
	template: `
		<ngts-line [points]="points()" [options]="parameters()">
			<ng-content />
		</ngts-line>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine],
})
export class NgtsQuadraticBezierLine {
	start = input<Vector3 | [number, number, number]>([0, 0, 0]);
	end = input<Vector3 | [number, number, number]>([0, 0, 0]);
	mid = input<Vector3 | [number, number, number]>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['segments']);

	private segments = pick(this.options, 'segments');

	line = viewChild.required(NgtsLine);

	points = computed(() => this.getPoints(this.start(), this.end(), this.mid(), this.segments()));

	private curve = new QuadraticBezierCurve3();

	setPoints(
		start: Vector3 | [number, number, number],
		end: Vector3 | [number, number, number],
		mid: Vector3 | [number, number, number],
	) {
		const points = this.getPoints(start, end, mid);
		const geometry = this.line().lineGeometry();
		if (geometry) geometry.setPositions(points.map((p) => p.toArray()).flat());
	}

	private getPoints(
		start: Vector3 | [number, number, number],
		end: Vector3 | [number, number, number],
		mid?: Vector3 | [number, number, number],
		segments = 20,
	) {
		if (start instanceof Vector3) this.curve.v0.copy(start);
		else this.curve.v0.set(...(start as [number, number, number]));
		if (end instanceof Vector3) this.curve.v2.copy(end);
		else this.curve.v2.set(...(end as [number, number, number]));
		if (mid instanceof Vector3) {
			this.curve.v1.copy(mid);
		} else if (Array.isArray(mid)) {
			this.curve.v1.set(...(mid as [number, number, number]));
		} else {
			this.curve.v1.copy(
				this.curve.v0
					.clone()
					.add(this.curve.v2.clone().sub(this.curve.v0))
					.add(new Vector3(0, this.curve.v0.y - this.curve.v2.y, 0)),
			);
		}
		return this.curve.getPoints(segments);
	}
}
