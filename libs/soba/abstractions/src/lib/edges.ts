import { afterNextRender, ChangeDetectionStrategy, Component, computed, input, viewChild } from '@angular/core';
import { checkNeedsUpdate, getLocalState, NgtMesh, omit } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BufferAttribute, BufferGeometry, ColorRepresentation, EdgesGeometry, Mesh } from 'three';
import { LineMaterialParameters } from 'three-stdlib';
import { NgtLine2, NgtLineMaterial, NgtsLine } from './line';

export type NgtsEdgesOptions = Partial<NgtMesh> & {
	threshold?: number;
	lineWidth?: number;
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
	Omit<Partial<NgtLine2>, 'geometry'> &
	Omit<Partial<NgtLineMaterial>, 'color' | 'vertexColors'> & {
		geometry?: BufferGeometry;
		color?: ColorRepresentation;
	};

const defaultOptions: NgtsEdgesOptions = {
	lineWidth: 1,
	threshold: 15,
};

@Component({
	selector: 'ngts-edges',
	standalone: true,
	template: `
		<ngts-line [points]="tmpPoints" [options]="lineOptions()">
			<ng-content />
		</ngts-line>
	`,
	imports: [NgtsLine],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsEdges {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	private parameters = omit(this.options, ['threshold', 'geometry']);

	protected lineOptions = computed(() => ({ ...this.parameters(), raycast: () => null }));
	protected tmpPoints = [0, 0, 0, 1, 0, 0];

	line = viewChild.required(NgtsLine);

	private memoizedGeometry?: BufferGeometry;
	private memoizedThreshold?: number;

	constructor() {
		const autoEffect = injectAutoEffect();
		afterNextRender(() => {
			autoEffect(() => {
				const line = this.line().lineRef()?.nativeElement;
				if (!line) return;

				const lS = getLocalState(line);
				if (!lS) return;

				const parent = lS.parent() as Mesh;
				if (!parent) return;

				const { geometry: explicitGeometry, threshold } = this.options();
				const geometry = explicitGeometry ?? parent.geometry;
				if (!geometry) return;

				const cached = this.memoizedGeometry === geometry && this.memoizedThreshold === threshold;
				if (cached) return;

				this.memoizedGeometry = geometry;
				this.memoizedThreshold = threshold;

				const points = (new EdgesGeometry(geometry, threshold).attributes['position'] as BufferAttribute)
					.array as Float32Array;
				line.geometry.setPositions(points);
				checkNeedsUpdate(line.geometry.attributes['instanceStart']);
				checkNeedsUpdate(line.geometry.attributes['instanceEnd']);
				line.computeLineDistances();
			});
		});
	}
}
