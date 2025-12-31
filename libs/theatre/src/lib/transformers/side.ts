import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

/**
 * Transformer for Three.js material side property.
 *
 * Converts between Three.js side constants (FrontSide, BackSide, DoubleSide)
 * and a switch UI in Theatre.js Studio with human-readable labels.
 *
 * Used automatically for the `side` property on materials.
 *
 * @example
 * ```typescript
 * import { side } from 'angular-three-theatre';
 *
 * // Used automatically for material.side, or manually:
 * [sync]="material"
 * [syncProps]="[['side', { transformer: side }]]"
 * ```
 */
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
