import { is } from 'angular-three';
import * as THREE from 'three';

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();
const v4 = new THREE.Vector2();

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

export type CalculatePosition = typeof defaultCalculatePosition;

export function isObjectBehindCamera(el: THREE.Object3D, camera: THREE.Camera) {
	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
	const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
	const deltaCamObj = objectPos.sub(cameraPos);
	const camDir = camera.getWorldDirection(v3);
	return deltaCamObj.angleTo(camDir) > Math.PI / 2;
}

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

export function epsilon(value: number) {
	return Math.abs(value) < 1e-10 ? 0 : value;
}

export function getCSSMatrix(matrix: THREE.Matrix4, multipliers: number[], prepend = '') {
	let matrix3d = 'matrix3d(';
	for (let i = 0; i !== 16; i++) {
		matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? ',' : ')');
	}
	return prepend + matrix3d;
}

export const getCameraCSSMatrix = ((multipliers: number[]) => {
	return (matrix: THREE.Matrix4) => getCSSMatrix(matrix, multipliers);
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1]);

export const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
	return (matrix: THREE.Matrix4, factor: number) =>
		getCSSMatrix(matrix, scaleMultipliers(factor), 'translate(-50%,-50%)');
})((f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1]);
