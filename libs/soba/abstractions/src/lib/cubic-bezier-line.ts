import { ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { CubicBezierCurve3, Vector3 } from 'three';
import { NgtsLine, NgtsLineOptions } from './line';

export interface NgtsCubicBezierLineOptions extends Omit<NgtsLineOptions, 'segments'> {
	segments?: number;
}

const defaultOptions: NgtsCubicBezierLineOptions = {
	lineWidth: 1,
	segments: 20,
};

@Component({
	selector: 'ngts-cubic-bezier-line',
	standalone: true,
	template: `
		<ngts-line [points]="points()" [options]="parameters()">
			<ng-content />
		</ngts-line>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine],
})
export class NgtsCubicBezierLine {
	start = input.required<Vector3 | [number, number, number]>();
	end = input.required<Vector3 | [number, number, number]>();
	midA = input.required<Vector3 | [number, number, number]>();
	midB = input.required<Vector3 | [number, number, number]>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['segments']);

	line = viewChild.required(NgtsLine);

	private segments = pick(this.options, 'segments');

	points = computed(() => {
		const [start, end, midA, midB, segments] = [this.start(), this.end(), this.midA(), this.midB(), this.segments()];
		const startV = start instanceof Vector3 ? start : new Vector3(...start);
		const endV = end instanceof Vector3 ? end : new Vector3(...end);
		const midAV = midA instanceof Vector3 ? midA : new Vector3(...midA);
		const midBV = midB instanceof Vector3 ? midB : new Vector3(...midB);
		return new CubicBezierCurve3(startV, midAV, midBV, endV).getPoints(segments);
	});
}
