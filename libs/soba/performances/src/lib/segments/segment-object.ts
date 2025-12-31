import { NgtThreeElement } from 'angular-three';
import * as THREE from 'three';

/**
 * Type definition for the SegmentObject element in Angular Three templates.
 */
export type NgtSegmentObject = NgtThreeElement<typeof SegmentObject>;

/**
 * A data object representing a single line segment.
 *
 * SegmentObject holds the start point, end point, and color of a line segment.
 * It is used internally by NgtsSegment to store segment data that is then
 * batched and rendered by the parent NgtsSegments component.
 */
export class SegmentObject {
	/**
	 * The color of the segment.
	 * @default new THREE.Color('white')
	 */
	color: THREE.Color;
	/**
	 * The starting point of the segment.
	 * @default new THREE.Vector3(0, 0, 0)
	 */
	start: THREE.Vector3;
	/**
	 * The ending point of the segment.
	 * @default new THREE.Vector3(0, 0, 0)
	 */
	end: THREE.Vector3;

	constructor() {
		this.color = new THREE.Color('white');
		this.start = new THREE.Vector3(0, 0, 0);
		this.end = new THREE.Vector3(0, 0, 0);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @rawOptions start|color|end
		 */
		'ngt-segment-object': NgtSegmentObject;
	}
}
