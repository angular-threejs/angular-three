import { ElementRef } from '@angular/core';
import { NgtThreeElement, resolveRef } from 'angular-three';
import * as THREE from 'three';

/**
 * Type definition for the PositionPoint element in Angular Three templates.
 */
export type NgtPositionPoint = NgtThreeElement<typeof PositionPoint>;

const _inverseMatrix = new THREE.Matrix4();
const _ray = new THREE.Ray();
const _sphere = new THREE.Sphere();
const _position = new THREE.Vector3();

/**
 * A virtual point class that represents a single point within a Points object.
 *
 * PositionPoint extends THREE.Group and provides the ability to position, color,
 * and size individual points while maintaining proper raycasting support.
 * Each PositionPoint is linked to a parent Points object and contributes its
 * position to the position buffer.
 *
 * This class enables individual points to receive pointer events, which is not
 * natively supported by THREE.Points.
 */
export class PositionPoint extends THREE.Group {
	/**
	 * The size of this point.
	 * @default 0
	 */
	size: number;
	/**
	 * The color of this point.
	 * @default new THREE.Color('white')
	 */
	color: THREE.Color;
	/**
	 * Reference to the parent Points object that this point belongs to.
	 */
	instance: ElementRef<THREE.Points> | THREE.Points | null | undefined;

	constructor() {
		super();
		this.size = 0;
		this.color = new THREE.Color('white');
		this.instance = undefined;
	}

	/**
	 * Gets the geometry from the parent Points object.
	 * This allows the virtual point to have bounds for frustum culling.
	 */
	get geometry() {
		return resolveRef(this.instance)?.geometry;
	}

	/**
	 * Custom raycast implementation that enables this virtual point to receive pointer events.
	 *
	 * @param raycaster - The raycaster to test against
	 * @param intersects - Array to populate with intersection results
	 */
	override raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
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
			const intersectPoint = new THREE.Vector3();
			_ray.closestPointToPoint(this.position, intersectPoint);
			intersectPoint.applyMatrix4(this.matrixWorld);
			const distance = raycaster.ray.origin.distanceTo(intersectPoint);
			if (distance < raycaster.near || distance > raycaster.far) return;
			intersects.push({
				distance,
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
