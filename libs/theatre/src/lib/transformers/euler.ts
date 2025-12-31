import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

/**
 * Transformer for Three.js Euler rotation objects.
 *
 * Converts Euler angles from radians to degrees for display in Theatre.js Studio.
 * Creates a compound property with x, y, z components shown in degrees.
 *
 * Used automatically for properties where `isEuler` is true (e.g., Object3D.rotation).
 *
 * @example
 * ```typescript
 * import { euler } from 'angular-three-theatre';
 *
 * // Used automatically for Euler properties, or manually:
 * [sync]="mesh"
 * [syncProps]="[['rotation', { transformer: euler }]]"
 * ```
 */
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
