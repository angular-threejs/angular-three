import { NgtSize } from 'angular-three';
import { Camera, Vector3 } from 'three';

const tV0 = new Vector3();
const tV1 = new Vector3();
const tV2 = new Vector3();

function getPoint2(point3: Vector3, camera: Camera, size: NgtSize) {
	const widthHalf = size.width / 2;
	const heightHalf = size.height / 2;
	camera.updateMatrixWorld(false);
	const vector = point3.project(camera);
	vector.x = vector.x * widthHalf + widthHalf;
	vector.y = -(vector.y * heightHalf) + heightHalf;
	return vector;
}

function getPoint3(point2: Vector3, camera: Camera, size: NgtSize, zValue: number = 1) {
	const vector = tV0.set((point2.x / size.width) * 2 - 1, -(point2.y / size.height) * 2 + 1, zValue);
	vector.unproject(camera);
	return vector;
}

export function calculateScaleFactor(point3: Vector3, radiusPx: number, camera: Camera, size: NgtSize) {
	const point2 = getPoint2(tV2.copy(point3), camera, size);
	let scale = 0;
	for (let i = 0; i < 2; ++i) {
		const point2off = tV1.copy(point2).setComponent(i, point2.getComponent(i) + radiusPx);
		const point3off = getPoint3(point2off, camera, size, point2off.z);
		scale = Math.max(scale, point3.distanceTo(point3off));
	}
	return scale;
}
