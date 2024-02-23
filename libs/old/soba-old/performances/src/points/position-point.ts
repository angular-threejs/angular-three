import { ElementRef } from '@angular/core';
import * as THREE from 'three';

const _inverseMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _ray = /*@__PURE__*/ new THREE.Ray();
const _sphere = /*@__PURE__*/ new THREE.Sphere();
const _position = /*@__PURE__*/ new THREE.Vector3();

export class PositionPoint extends THREE.Group {
	size: number;
	color: THREE.Color;
	instance: ElementRef<THREE.Points | undefined>;
	instanceKey: ElementRef<PositionPoint | undefined>;

	constructor() {
		super();
		this.size = 0;
		this.color = new THREE.Color('white');
		this.instance = new ElementRef(undefined);
		this.instanceKey = new ElementRef(undefined);
	}

	// This will allow the virtual instance have bounds
	get geometry() {
		return this.instance.nativeElement?.geometry;
	}

	override raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
		const parent = this.instance.nativeElement;
		if (!parent || !parent.geometry) return;
		const instanceId = parent.userData['instances'].indexOf(this.instanceKey);
		// If the instance wasn't found or exceeds the parents draw range, bail out
		if (instanceId === -1 || instanceId > parent.geometry.drawRange.count) return;

		const threshold = raycaster.params.Points?.threshold ?? 1;
		_sphere.set(this.getWorldPosition(_position), threshold);
		if (raycaster.ray.intersectsSphere(_sphere) === false) return;

		_inverseMatrix.copy(parent.matrixWorld).invert();
		_ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix);

		const localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3);
		const localThresholdSq = localThreshold * localThreshold;
		const rayPointDistanceSq = _ray.distanceSqToPoint(this.position);

		if (rayPointDistanceSq < localThresholdSq) {
			const intersectPoint = new THREE.Vector3();
			_ray.closestPointToPoint(this.position, intersectPoint);
			intersectPoint.applyMatrix4(this.matrixWorld);
			const distance = raycaster.ray.origin.distanceTo(intersectPoint);
			if (distance < raycaster.near || distance > raycaster.far) return;
			intersects.push({
				distance: distance,
				distanceToRay: Math.sqrt(rayPointDistanceSq),
				point: intersectPoint,
				index: instanceId,
				face: null,
				object: this,
			});
		}
	}
}