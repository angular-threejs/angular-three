import type * as THREE from 'three';
import type { NgtCamera, NgtSize } from '../types';
import { is } from './is';

/**
 * Sets the needsUpdate flag on an object if it has one.
 *
 * Also sets uniformsNeedUpdate for shader materials.
 *
 * @param value - The object to update
 */
export function checkNeedsUpdate(value: unknown) {
	if (value !== null && is.obj(value) && 'needsUpdate' in value) {
		value['needsUpdate'] = true;
		if ('uniformsNeedUpdate' in value) value['uniformsNeedUpdate'] = true;
	}
}

/**
 * Performs necessary updates on a Three.js object after property changes.
 *
 * For cameras, updates projection matrix and world matrix.
 * For other objects, sets the needsUpdate flag.
 *
 * @param value - The object to update
 */
export function checkUpdate(value: unknown) {
	// TODO (chau): this is messing with PivotControls. Re-evaluate later
	// if (is.object3D(value)) value.updateMatrix();

	if (is.three<THREE.Camera>(value, 'isCamera')) {
		if (
			is.three<THREE.PerspectiveCamera>(value, 'isPerspectiveCamera') ||
			is.three<THREE.OrthographicCamera>(value, 'isOrthographicCamera')
		)
			value.updateProjectionMatrix();
		value.updateMatrixWorld();
	}

	// NOTE: skip checkNeedsUpdate for CubeTexture
	if (is.three<THREE.CubeTexture>(value, 'isCubeTexture')) return;

	checkNeedsUpdate(value);
}

/**
 * Updates a camera's projection based on the viewport size.
 *
 * For orthographic cameras, updates the frustum bounds.
 * For perspective cameras, updates the aspect ratio.
 * Skips update if the camera is marked as manual.
 *
 * @param camera - The camera to update
 * @param size - The current viewport size
 */
export function updateCamera(camera: NgtCamera, size: NgtSize) {
	if (!camera.manual) {
		if (is.three<THREE.OrthographicCamera>(camera, 'isOrthographicCamera')) {
			camera.left = size.width / -2;
			camera.right = size.width / 2;
			camera.top = size.height / 2;
			camera.bottom = size.height / -2;
		} else {
			camera.aspect = size.width / size.height;
		}

		camera.updateProjectionMatrix();
		camera.updateMatrixWorld();
	}
}
