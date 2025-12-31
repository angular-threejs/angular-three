import { is } from 'angular-three';
import * as THREE from 'three';

// Reusable vectors to avoid allocations in hot paths
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const v4 = new THREE.Vector2();

/**
 * Calculates the 2D screen position of a 3D object.
 *
 * Projects the object's world position through the camera to get
 * normalized device coordinates, then converts to pixel coordinates.
 *
 * @param el - The THREE.Object3D to project
 * @param camera - The camera to project through
 * @param size - The canvas size in pixels
 * @returns `[x, y]` screen coordinates in pixels (top-left origin)
 */
export function defaultCalculatePosition(
	el: THREE.Object3D,
	camera: THREE.Camera,
	size: { width: number; height: number },
) {
	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
	objectPos.project(camera);
	const widthHalf = size.width / 2;
	const heightHalf = size.height / 2;
	return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
}

/**
 * Function signature for custom position calculation.
 * @see defaultCalculatePosition
 */
export type CalculatePosition = typeof defaultCalculatePosition;

/**
 * Determines if an object is behind the camera.
 *
 * Calculates the angle between the camera's forward direction and
 * the vector from camera to object. If > 90 degrees, object is behind.
 *
 * @param el - The object to check
 * @param camera - The camera reference
 * @returns `true` if the object is behind the camera
 */
export function isObjectBehindCamera(el: THREE.Object3D, camera: THREE.Camera) {
	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
	const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
	const deltaCamObj = objectPos.sub(cameraPos);
	const camDir = camera.getWorldDirection(v3);
	return deltaCamObj.angleTo(camDir) > Math.PI / 2;
}

/**
 * Checks if an object is visible (not occluded by other objects).
 *
 * Casts a ray from the camera through the object's screen position
 * and checks if any occluding objects are closer than the target.
 *
 * @param el - The object to check visibility for
 * @param camera - The camera reference
 * @param raycaster - Raycaster instance for intersection tests
 * @param occlude - Array of objects that can occlude the target
 * @returns `true` if the object is visible (not occluded)
 */
export function isObjectVisible(
	el: THREE.Object3D,
	camera: THREE.Camera,
	raycaster: THREE.Raycaster,
	occlude: THREE.Object3D[],
) {
	const elPos = v1.setFromMatrixPosition(el.matrixWorld);
	const screenPos = elPos.clone();
	screenPos.project(camera);
	v4.set(screenPos.x, screenPos.y);
	raycaster.setFromCamera(v4, camera);
	const intersects = raycaster.intersectObjects(occlude, true);
	if (intersects.length) {
		const intersectionDistance = intersects[0].distance;
		const pointDistance = elPos.distanceTo(raycaster.ray.origin);
		return pointDistance < intersectionDistance;
	}
	return true;
}

/**
 * Calculates a scale factor based on object distance from camera.
 *
 * For perspective cameras, returns a value that makes objects appear
 * the same size regardless of distance. For orthographic cameras,
 * returns the camera zoom level.
 *
 * @param el - The object to calculate scale for
 * @param camera - The camera reference
 * @returns Scale factor (smaller values for distant objects in perspective)
 */
export function objectScale(el: THREE.Object3D, camera: THREE.Camera) {
	if (is.three<THREE.OrthographicCamera>(camera, 'isOrthographicCamera')) return camera.zoom;
	if (is.three<THREE.PerspectiveCamera>(camera, 'isPerspectiveCamera')) {
		const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
		const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
		const vFOV = (camera.fov * Math.PI) / 180;
		const dist = objectPos.distanceTo(cameraPos);
		const scaleFOV = 2 * Math.tan(vFOV / 2) * dist;
		return 1 / scaleFOV;
	}
	return 1;
}

/**
 * Calculates a z-index value based on object distance from camera.
 *
 * Maps the distance from camera (between near and far planes) to
 * the provided z-index range. Closer objects get higher z-index values.
 *
 * @param el - The object to calculate z-index for
 * @param camera - The camera reference (must be Perspective or Orthographic)
 * @param zIndexRange - `[max, min]` range to map distance to
 * @returns Calculated z-index, or `undefined` for unsupported camera types
 */
export function objectZIndex(el: THREE.Object3D, camera: THREE.Camera, zIndexRange: Array<number>) {
	if (
		is.three<THREE.PerspectiveCamera>(camera, 'isPerspectiveCamera') ||
		is.three<THREE.OrthographicCamera>(camera, 'isOrthographicCamera')
	) {
		const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
		const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
		const dist = objectPos.distanceTo(cameraPos);
		const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
		const B = zIndexRange[1] - A * camera.far;
		return Math.round(A * dist + B);
	}
	return undefined;
}

/**
 * Clamps very small values to zero to avoid floating point precision issues in CSS.
 * @param value - The number to check
 * @returns `0` if value is smaller than 1e-10, otherwise the original value
 */
export function epsilon(value: number) {
	return Math.abs(value) < 1e-10 ? 0 : value;
}

/**
 * Converts a THREE.Matrix4 to a CSS matrix3d() string.
 *
 * @param matrix - The 4x4 transformation matrix
 * @param multipliers - Array of 16 multipliers for each matrix element
 * @param prepend - Optional string to prepend (e.g., 'translate(-50%,-50%)')
 * @returns CSS matrix3d() transform string
 */
export function getCSSMatrix(matrix: THREE.Matrix4, multipliers: number[], prepend = '') {
	let matrix3d = 'matrix3d(';
	for (let i = 0; i !== 16; i++) {
		matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? ',' : ')');
	}
	return prepend + matrix3d;
}

/**
 * Converts camera's inverse world matrix to CSS matrix3d.
 * Applies Y-axis flip to account for CSS vs WebGL coordinate differences.
 */
export const getCameraCSSMatrix = ((multipliers: number[]) => {
	return (matrix: THREE.Matrix4) => getCSSMatrix(matrix, multipliers);
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1]);

/**
 * Converts object's world matrix to CSS matrix3d with centering and scaling.
 * Prepends translate(-50%,-50%) to center the element on the transform origin.
 *
 * @param matrix - The object's world matrix
 * @param factor - Scale factor derived from distanceFactor
 */
export const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
	return (matrix: THREE.Matrix4, factor: number) =>
		getCSSMatrix(matrix, scaleMultipliers(factor), 'translate(-50%,-50%)');
})((f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1]);
