import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';
import { extend, getInstanceState, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';

/**
 * State object emitted by the NgtsCenter component when centering is complete.
 * Contains information about the centered content's dimensions and alignment.
 */
export interface NgtsCenterState {
	/**
	 * The parent object above the Center component.
	 */
	parent: THREE.Object3D;
	/**
	 * The outermost container group of the Center component.
	 */
	container: THREE.Object3D;
	/**
	 * The width of the bounding box.
	 */
	width: number;
	/**
	 * The height of the bounding box.
	 */
	height: number;
	/**
	 * The depth of the bounding box.
	 */
	depth: number;
	/**
	 * The calculated bounding box of the content.
	 */
	boundingBox: THREE.Box3;
	/**
	 * The calculated bounding sphere of the content.
	 */
	boundingSphere: THREE.Sphere;
	/**
	 * The center point of the bounding box.
	 */
	center: THREE.Vector3;
	/**
	 * The vertical alignment offset applied.
	 */
	verticalAlignment: number;
	/**
	 * The horizontal alignment offset applied.
	 */
	horizontalAlignment: number;
	/**
	 * The depth alignment offset applied.
	 */
	depthAlignment: number;
}

/**
 * Configuration options for the NgtsCenter component.
 */
export interface NgtsCenterOptions {
	/**
	 * Aligns content to the top of the bounding box.
	 */
	top?: boolean;
	/**
	 * Aligns content to the right of the bounding box.
	 */
	right?: boolean;
	/**
	 * Aligns content to the bottom of the bounding box.
	 */
	bottom?: boolean;
	/**
	 * Aligns content to the left of the bounding box.
	 */
	left?: boolean;
	/**
	 * Aligns content to the front of the bounding box.
	 */
	front?: boolean;
	/**
	 * Aligns content to the back of the bounding box.
	 */
	back?: boolean;
	/**
	 * Disables centering on all axes.
	 */
	disable?: boolean;
	/**
	 * Disables centering on the x-axis only.
	 */
	disableX?: boolean;
	/**
	 * Disables centering on the y-axis only.
	 */
	disableY?: boolean;
	/**
	 * Disables centering on the z-axis only.
	 */
	disableZ?: boolean;
	/**
	 * Uses precise bounding box calculation.
	 * @see https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject
	 * @default true
	 */
	precise: boolean;
	/**
	 * Optional cache key to prevent recalculation on every render.
	 * Change this value to force a recalculation.
	 * @default 0
	 */
	cacheKey: any;
	/**
	 * Optional object to compute the bounding box from instead of the children.
	 */
	object?: THREE.Object3D | null;
}

const defaultOptions: Partial<NgtThreeElements['ngt-group']> & NgtsCenterOptions = {
	precise: true,
	cacheKey: 0,
};

/**
 * A component that automatically centers its children within their bounding box.
 * Supports alignment options for positioning content relative to the bounding box edges.
 *
 * Emits a `centered` event with detailed information about the centering calculation,
 * including dimensions, bounding box, and alignment offsets.
 *
 * @example
 * ```html
 * <ngts-center [options]="{ top: true }" (centered)="onCentered($event)">
 *   <ngt-mesh>
 *     <ngt-box-geometry />
 *     <ngt-mesh-standard-material />
 *   </ngt-mesh>
 * </ngts-center>
 * ```
 */
@Component({
	selector: 'ngts-center',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-group #outer>
				<ngt-group #inner>
					<ng-content />
				</ngt-group>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsCenter {
	/** Configuration options for centering behavior. */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'top',
		'right',
		'bottom',
		'left',
		'front',
		'back',
		'disable',
		'disableX',
		'disableY',
		'disableZ',
		'precise',
		'cacheKey',
		'object',
	]);

	/** Emits when centering calculation completes with dimension and alignment info. */
	centered = output<NgtsCenterState>();

	/** Reference to the outer group element containing the centered content. */
	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	private outerRef = viewChild.required<ElementRef<THREE.Group>>('outer');
	private innerRef = viewChild.required<ElementRef<THREE.Group>>('inner');

	private centerOptions = pick(this.options, [
		'top',
		'right',
		'bottom',
		'left',
		'front',
		'back',
		'disable',
		'disableX',
		'disableY',
		'disableZ',
		'precise',
		'cacheKey',
		'object',
	]);

	private box = new THREE.Box3();
	private center = new THREE.Vector3();
	private sphere = new THREE.Sphere();

	constructor() {
		extend({ Group });

		effect(() => {
			const inner = this.innerRef().nativeElement;
			const innerInstanceState = getInstanceState(inner);
			if (!innerInstanceState) return;

			const children = [...innerInstanceState.objects(), ...innerInstanceState.nonObjects()];
			if (!children?.length) return;

			const [
				{ precise, top, bottom, right, left, front, back, disable, disableZ, disableY, disableX, object },
				group,
				outer,
			] = [this.centerOptions(), this.groupRef().nativeElement, this.outerRef().nativeElement];

			outer.matrixWorld.identity();
			this.box.setFromObject(object ?? inner, precise);

			const width = this.box.max.x - this.box.min.x;
			const height = this.box.max.y - this.box.min.y;
			const depth = this.box.max.z - this.box.min.z;

			this.box.getCenter(this.center);
			this.box.getBoundingSphere(this.sphere);

			const vAlign = top ? height / 2 : bottom ? -height / 2 : 0;
			const hAlign = left ? -width / 2 : right ? width / 2 : 0;
			const dAlign = front ? depth / 2 : back ? -depth / 2 : 0;

			outer.position.set(
				disable || disableX ? 0 : -this.center.x + hAlign,
				disable || disableY ? 0 : -this.center.y + vAlign,
				disable || disableZ ? 0 : -this.center.z + dAlign,
			);

			this.centered.emit({
				parent: group.parent!,
				container: group,
				width,
				height,
				depth,
				boundingBox: this.box,
				boundingSphere: this.sphere,
				center: this.center,
				verticalAlignment: vAlign,
				horizontalAlignment: hAlign,
				depthAlignment: dAlign,
			});
		});
	}
}
