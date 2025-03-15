import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

export const euler = createTransformer({
	transform(value) {
		return types.compound({
			x: value.x * THREE.MathUtils.RAD2DEG,
			y: value.y * THREE.MathUtils.RAD2DEG,
			z: value.z * THREE.MathUtils.RAD2DEG,
		});
	},
	apply(target, path, value) {
		target[path].x = value.x * THREE.MathUtils.DEG2RAD;
		target[path].y = value.y * THREE.MathUtils.DEG2RAD;
		target[path].z = value.z * THREE.MathUtils.DEG2RAD;
	},
});
