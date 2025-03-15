import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

const _color = new THREE.Color();

export const color = createTransformer({
	transform(value) {
		value.getRGB(_color, THREE.SRGBColorSpace);
		return types.rgba({ r: _color.r, g: _color.g, b: _color.b, a: 1 });
	},
	apply(target, path, value) {
		target[path].setRGB(value.r, value.g, value.b, THREE.SRGBColorSpace);
	},
});
