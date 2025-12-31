import { types } from '@theatre/core';
import * as THREE from 'three';
import { createTransformer } from './transformer';

const _color = new THREE.Color();

/**
 * Transformer for Three.js Color objects.
 *
 * Converts Three.js Color to Theatre.js RGBA format for the color picker UI.
 * Uses sRGB color space for accurate color representation.
 *
 * @example
 * ```typescript
 * import { color } from 'angular-three-theatre';
 *
 * // Used automatically for Color properties, or manually:
 * [sync]="material"
 * [syncProps]="[['emissive', { transformer: color }]]"
 * ```
 */
export const color = createTransformer({
	transform(value) {
		value.getRGB(_color, THREE.SRGBColorSpace);
		return types.rgba({ r: _color.r, g: _color.g, b: _color.b, a: 1 });
	},
	apply(target, path, value) {
		target[path].setRGB(value.r, value.g, value.b, THREE.SRGBColorSpace);
	},
});
