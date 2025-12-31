import { types } from '@theatre/core';
import { createTransformer } from './transformer';

/**
 * Transformer for normalized values in the 0-1 range.
 *
 * Creates a number input with a slider constrained to the 0-1 range.
 * Used automatically for material properties like opacity, roughness,
 * metalness, transmission, and color components (r, g, b).
 *
 * @example
 * ```typescript
 * import { normalized } from 'angular-three-theatre';
 *
 * // Used automatically for common properties, or manually:
 * [sync]="material"
 * [syncProps]="[['customNormalizedValue', { transformer: normalized }]]"
 * ```
 */
export const normalized = createTransformer({
	transform(value) {
		return types.number(value, { range: [0, 1] });
	},
	apply(target, path, value) {
		target[path] = value;
	},
});
