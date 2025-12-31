import { types } from '@theatre/core';
import { createTransformer } from './transformer';

/**
 * Generic fallback transformer that handles common JavaScript types.
 *
 * Automatically detects the value type and applies the appropriate Theatre.js type:
 * - Numbers → `types.number` (Infinity converted to MAX_VALUE)
 * - Strings → `types.string`
 * - Booleans → `types.boolean`
 * - Objects → `types.compound` (spreads properties)
 *
 * Used as the default transformer when no specific transformer matches.
 *
 * @example
 * ```typescript
 * import { generic } from 'angular-three-theatre';
 *
 * // Explicitly use generic transformer:
 * [sync]="mesh"
 * [syncProps]="[['customProperty', { transformer: generic }]]"
 * ```
 */
export const generic = createTransformer({
	transform(value) {
		if (typeof value === 'number') {
			return types.number(value === Infinity ? Number.MAX_VALUE : value);
		} else if (typeof value === 'string') {
			return types.string(value);
		} else if (typeof value === 'boolean') {
			return types.boolean(value);
		}
		return types.compound({ ...value });
	},
	apply(target, path, value) {
		if (target[path] !== null && typeof target[path] === 'object') {
			Object.assign(target[path], value);
		} else {
			target[path] = value;
		}
	},
});
