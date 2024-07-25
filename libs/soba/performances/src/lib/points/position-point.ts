import { ElementRef } from '@angular/core';
import { NgtObject3DNode, resolveRef } from 'angular-three';
import { Color, Group, Intersection, Matrix4, Points, Ray, Raycaster, Sphere, Vector3 } from 'three';

export type NgtPositionPoint = NgtObject3DNode<PositionPoint, typeof PositionPoint>;

const _inverseMatrix = new Matrix4();
const _ray = new Ray();
const _sphere = new Sphere();
const _position = new Vector3();

export class PositionPoint extends Group {
	size: number;
	color: Color;
	instance: ElementRef<Points> | Points | null | undefined;

	constructor() {
		super();
		this.size = 0;
		this.color = new Color('white');
		this.instance = undefined;
	}

	// This will allow the virtual instance have bounds
	get geometry() {
		return resolveRef(this.instance)?.geometry;
	}

	override raycast(raycaster: Raycaster, intersects: Intersection[]) {
		const parent = resolveRef(this.instance);
		if (!parent || !parent.geometry) return;
		const instanceId = parent.userData['instances'].indexOf(this);
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
			const intersectPoint = new Vector3();
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

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 * @rawOptions instance|color|size
		 */
		'ngt-position-point': NgtPositionPoint;
	}
}
