import * as THREE from 'three';

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
