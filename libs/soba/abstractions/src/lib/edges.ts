import { ChangeDetectionStrategy, Component, computed, effect, input, viewChild } from '@angular/core';
import { checkNeedsUpdate, getInstanceState, NgtThreeElements, omit } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { LineMaterialParameters } from 'three-stdlib';
import { NgtLine2, NgtLineMaterial, NgtsLine } from './line';

/**
 * Configuration options for the NgtsEdges component.
 * Combines mesh properties, line material parameters, and edge-specific options.
 */
export type NgtsEdgesOptions = Partial<NgtThreeElements['ngt-mesh']> & {
	/**
	 * Angle threshold in degrees for edge detection.
	 * Edges with angles greater than this value will be rendered.
	 * @default 15
	 */
	threshold?: number;
	/**
	 * Width of the edge lines.
	 * @default 1
	 */
	lineWidth?: number;
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
	Omit<Partial<NgtLine2>, 'geometry'> &
	Omit<Partial<NgtLineMaterial>, 'color' | 'vertexColors'> & {
		/**
		 * Optional geometry to compute edges from. If not provided, uses parent mesh geometry.
		 */
		geometry?: THREE.BufferGeometry;
		/**
		 * Color of the edge lines.
		 */
		color?: THREE.ColorRepresentation;
	};

const defaultOptions: NgtsEdgesOptions = {
	lineWidth: 1,
	threshold: 15,
};

/**
 * A component that renders the edges of a mesh geometry as lines.
 * Must be placed as a child of a mesh to automatically detect its geometry.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-box-geometry />
 *   <ngt-mesh-basic-material />
 *   <ngts-edges [options]="{ color: 'black', threshold: 15 }" />
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-edges',
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

	protected lineOptions = computed(() => ({ ...this.parameters(), segments: true, raycast: () => null }));
	protected tmpPoints = [0, 0, 0, 1, 0, 0];

	line = viewChild.required(NgtsLine);

	private memoizedGeometry?: THREE.BufferGeometry;
	private memoizedThreshold?: number;

	constructor() {
		effect(() => {
			const line = this.line().lineRef()?.nativeElement;
			if (!line) return;

			const lS = getInstanceState(line);
			if (!lS) return;

			const parent = lS.parent() as unknown as THREE.Mesh;
			if (!parent) return;

			const { geometry: explicitGeometry, threshold } = this.options();
			const geometry = explicitGeometry ?? parent.geometry;
			if (!geometry) return;

			const cached = this.memoizedGeometry === geometry && this.memoizedThreshold === threshold;
			if (cached) return;

			this.memoizedGeometry = geometry;
			this.memoizedThreshold = threshold;

			const points = (
				new THREE.EdgesGeometry(geometry, threshold).attributes['position'] as THREE.BufferAttribute
			).array as Float32Array;
			line.geometry.setPositions(points);
			checkNeedsUpdate(line.geometry.attributes['instanceStart']);
			checkNeedsUpdate(line.geometry.attributes['instanceEnd']);
			line.computeLineDistances();
		});
	}
}
