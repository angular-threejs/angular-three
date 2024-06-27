import { NgtCameraManual, NgtSize } from '../store';
import { is } from './is';

export function updateCamera(camera: NgtCameraManual, size: NgtSize) {
	// https://github.com/pmndrs/react-three-fiber/issues/92
	// Do not mess with the camera if it belongs to the user
	if (!camera.manual) {
		if (is.orthographicCamera(camera)) {
			camera.left = size.width / -2;
			camera.right = size.width / 2;
			camera.top = size.height / 2;
			camera.bottom = size.height / -2;
		} else {
			camera.aspect = size.width / size.height;
		}

		camera.updateProjectionMatrix();
		// https://github.com/pmndrs/react-three-fiber/issues/178
		// Update matrix world since the renderer is a frame late
		camera.updateMatrixWorld();
	}
}

export function checkNeedsUpdate(value: unknown) {
	if (value !== null && is.obj(value) && 'needsUpdate' in value) {
		value['needsUpdate'] = true;
		if ('uniformsNeedUpdate' in value) value['uniformsNeedUpdate'] = true;
	}
}

export function checkUpdate(value: unknown) {
	if (is.object3D(value)) value.updateMatrix();

	if (is.camera(value)) {
		if (is.perspectiveCamera(value) || is.orthographicCamera(value)) value.updateProjectionMatrix();
		value.updateMatrixWorld();
	}

	checkNeedsUpdate(value);
}
