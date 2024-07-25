import { NgtNode } from 'angular-three';
import { Color, Vector3 } from 'three';

export type NgtSegmentObject = NgtNode<SegmentObject, typeof SegmentObject>;

export class SegmentObject {
	color: Color;
	start: Vector3;
	end: Vector3;

	constructor() {
		this.color = new Color('white');
		this.start = new Vector3(0, 0, 0);
		this.end = new Vector3(0, 0, 0);
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
