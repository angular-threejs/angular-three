import { ChangeDetectionStrategy, Component, computed, input, untracked, viewChild } from '@angular/core';
import { omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { CatmullRomCurve3, Color, Vector3 } from 'three';
import { NgtsLine, NgtsLineOptions } from './line';

export interface NgtsCatmullRomLineOptions extends Omit<NgtsLineOptions, 'segments'> {
	curveType: 'centripetal' | 'chordal' | 'catmullrom';
	tension: number;
	segments: number;
	closed: boolean;
}

const defaultOptions: NgtsCatmullRomLineOptions = {
	curveType: 'centripetal',
	tension: 0.5,
	segments: 20,
	closed: false,
	lineWidth: 1,
};

@Component({
	selector: 'ngts-catmull-rom-line',
	standalone: true,
	template: `
		<ngts-line [points]="segmentedPoints()" [options]="lineOptions()">
			<ng-content />
		</ngts-line>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine],
})
export class NgtsCatmullRomLine {
	points = input.required<Array<Vector3 | [number, number, number]>>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['curveType', 'tension', 'segments', 'closed', 'vertexColors']);

	line = viewChild.required(NgtsLine);

	private closed = pick(this.options, 'closed');
	private curveType = pick(this.options, 'curveType');
	private tension = pick(this.options, 'tension');
	private segments = pick(this.options, 'segments');
	private vertexColors = pick(this.options, 'vertexColors');

	private curve = computed(() => {
		const [points, closed, curveType, tension] = [this.points(), this.closed(), this.curveType(), this.tension()];

		const mappedPoints = points.map((pt) =>
			pt instanceof Vector3 ? pt : new Vector3(...(pt as [number, number, number])),
		);

		return new CatmullRomCurve3(mappedPoints, closed, curveType, tension);
	});

	segmentedPoints = computed(() => {
		const [curve, segments] = [this.curve(), this.segments()];
		return curve.getPoints(segments);
	});

	private interpolatedVertexColors = computed(() => {
		const [vertexColors, segments] = [this.vertexColors(), this.segments()];
		if (!vertexColors || vertexColors.length < 2) return undefined;

		if (vertexColors.length === segments + 1) return vertexColors;

		const mappedColors = vertexColors.map((color) =>
			color instanceof Color ? color : new Color(...(color as [number, number, number])),
		);
		if (untracked(this.closed)) mappedColors.push(mappedColors[0].clone());

		const iColors: Color[] = [mappedColors[0]];
		const divisions = segments / (mappedColors.length - 1);
		for (let i = 1; i < segments; i++) {
			const alpha = (i % divisions) / divisions;
			const colorIndex = Math.floor(i / divisions);
			iColors.push(mappedColors[colorIndex].clone().lerp(mappedColors[colorIndex + 1], alpha));
		}
		iColors.push(mappedColors[mappedColors.length - 1]);

		return iColors;
	});

	lineOptions = computed(() => ({ ...this.parameters(), vertexColors: this.interpolatedVertexColors() }));
}
