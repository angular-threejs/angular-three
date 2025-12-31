import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

/**
 * Transformer for radian values that displays as degrees in the UI.
 *
 * Converts between radians (used by Three.js) and degrees (more intuitive for users).
 * Used automatically for rotation.x, rotation.y, and rotation.z properties.
 *
 * @example
 * ```typescript
 * import { degrees } from 'angular-three-theatre';
 *
 * // Used automatically for rotation components, or manually:
 * [sync]="camera"
 * [syncProps]="[['fov', { transformer: degrees }]]"
 * ```
 */
export const degrees = createTransformer({
	transform(target) {
		return types.number(target * THREE.MathUtils.RAD2DEG);
	},
	apply(target, path, value) {
		target[path] = value * THREE.MathUtils.DEG2RAD;
	},
});
