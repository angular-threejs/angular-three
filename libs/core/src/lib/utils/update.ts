import type * as THREE from 'three';
import type { NgtCamera, NgtSize } from '../types';
import { is } from './is';

export function checkNeedsUpdate(value: unknown) {
	if (value !== null && is.obj(value) && 'needsUpdate' in value) {
		value['needsUpdate'] = true;
		if ('uniformsNeedUpdate' in value) value['uniformsNeedUpdate'] = true;
	}
}

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
