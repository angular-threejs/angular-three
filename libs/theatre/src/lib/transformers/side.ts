import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

export const side = createTransformer({
	transform(value) {
		// TODO: fix this type
		return types.stringLiteral(
			value === THREE.FrontSide ? 'f' : value === THREE.BackSide ? 'b' : 'd',
			{ f: 'Front', b: 'Back', d: 'Double' },
			{ as: 'switch' },
		) as any;
	},
	apply(target, path, value) {
		target[path] = value === 'f' ? THREE.FrontSide : value === 'b' ? THREE.BackSide : THREE.DoubleSide;
	},
});
