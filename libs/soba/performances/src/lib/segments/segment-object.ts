import { NgtThreeElement } from 'angular-three';
import * as THREE from 'three';

export type NgtSegmentObject = NgtThreeElement<typeof SegmentObject>;

export class SegmentObject {
	color: THREE.Color;
	start: THREE.Vector3;
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
