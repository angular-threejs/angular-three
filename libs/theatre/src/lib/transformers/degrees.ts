import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

export const degrees = createTransformer({
	transform(target) {
		return types.number(target * THREE.MathUtils.RAD2DEG);
	},
	apply(target, path, value) {
		target[path] = value * THREE.MathUtils.DEG2RAD;
	},
});
