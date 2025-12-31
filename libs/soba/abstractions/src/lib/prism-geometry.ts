import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, is, NgtArgs, NgtAttachable } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { ExtrudeGeometry } from 'three';

/**
 * Configuration options for the NgtsPrismGeometry component.
 * Extends Three.js ExtrudeGeometryOptions but replaces 'depth' with 'height'.
 */
export interface NgtsPrismGeometryOptions extends Omit<THREE.ExtrudeGeometryOptions, 'depth'> {
	/**
	 * Height of the prism extrusion.
	 * @default 1
	 */
	height: number;
}

const defaultOptions: NgtsPrismGeometryOptions = {
	height: 1,
	bevelEnabled: false,
};

/**
 * A component that creates a prism geometry by extruding a shape defined by vertices.
 * Useful for creating custom prismatic shapes like triangular prisms, hexagonal prisms, etc.
 *
 * @example
 * ```html
 * <!-- Triangular prism -->
 * <ngt-mesh>
 *   <ngts-prism-geometry
 *     [vertices]="[[0, 1], [-1, -1], [1, -1]]"
 *     [options]="{ height: 2 }"
 *   />
 *   <ngt-mesh-standard-material />
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-prism-geometry',
	template: `
		<ngt-extrude-geometry #geometry *args="[shape(), parameters()]" [attach]="attach()">
			<ng-content />
		</ngt-extrude-geometry>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsPrismGeometry {
	/**
	 * Defines how the geometry attaches to its parent.
	 * @default 'geometry'
	 */
	attach = input<NgtAttachable>('geometry');

	/**
	 * Array of 2D vertices defining the base shape of the prism.
	 * Accepts Vector2 instances or [x, y] tuples.
	 */
	vertices = input.required<Array<THREE.Vector2 | [number, number]>>();

	/**
	 * Configuration options for the prism geometry.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected parameters = computed(() => ({ ...this.options(), depth: this.options().height }));
	protected shape = computed(() => {
		const vertices = this.vertices();
		const interpolatedVertices = vertices.map((v) =>
			is.three<THREE.Vector2>(v, 'isVector2') ? v : new THREE.Vector2(...v),
		);
		return new THREE.Shape(interpolatedVertices);
	});

	/**
	 * Reference to the underlying ExtrudeGeometry Three.js object.
	 */
	geometryRef = viewChild<ElementRef<THREE.ExtrudeGeometry>>('geometry');

	constructor() {
		extend({ ExtrudeGeometry });
	}
}
