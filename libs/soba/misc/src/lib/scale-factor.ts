import { NgtSize } from 'angular-three';
import * as THREE from 'three';

// Reusable vectors to avoid allocations in hot paths
const tV0 = new THREE.Vector3();
const tV1 = new THREE.Vector3();
const tV2 = new THREE.Vector3();

/**
 * Projects a 3D point to 2D screen coordinates.
 * @internal
 */
function getPoint2(point3: THREE.Vector3, camera: THREE.Camera, size: NgtSize) {
	const widthHalf = size.width / 2;
	const heightHalf = size.height / 2;
	camera.updateMatrixWorld(false);
	const vector = point3.project(camera);
	vector.x = vector.x * widthHalf + widthHalf;
	vector.y = -(vector.y * heightHalf) + heightHalf;
	return vector;
}

/**
 * Unprojects a 2D screen point back to 3D world coordinates.
 * @internal
 */
function getPoint3(point2: THREE.Vector3, camera: THREE.Camera, size: NgtSize, zValue: number = 1) {
	const vector = tV0.set((point2.x / size.width) * 2 - 1, -(point2.y / size.height) * 2 + 1, zValue);
	vector.unproject(camera);
	return vector;
}

/**
 * Calculates a scale factor to maintain consistent pixel-size at a 3D position.
 *
 * Given a 3D point and a desired radius in pixels, computes how much to scale
 * an object so it appears that size on screen. Useful for keeping UI elements
 * or sprites at a consistent visual size regardless of distance from camera.
 *
 * @param point3 - The 3D world position to calculate scale for
 * @param radiusPx - Desired radius in screen pixels
 * @param camera - The camera used for projection
 * @param size - The viewport/canvas size
 * @returns Scale factor to apply to the object
 *
 * @example
 * ```typescript
 * beforeRender(({ camera, size }) => {
 *   const scale = calculateScaleFactor(mesh.position, 50, camera, size);
 *   mesh.scale.setScalar(scale);
 * });
 * ```
 */
export function calculateScaleFactor(point3: THREE.Vector3, radiusPx: number, camera: THREE.Camera, size: NgtSize) {
	const point2 = getPoint2(tV2.copy(point3), camera, size);
	let scale = 0;
	for (let i = 0; i < 2; ++i) {
		const point2off = tV1.copy(point2).setComponent(i, point2.getComponent(i) + radiusPx);
		const point3off = getPoint3(point2off, camera, size, point2off.z);
		scale = Math.max(scale, point3.distanceTo(point3off));
	}
	return scale;
}
