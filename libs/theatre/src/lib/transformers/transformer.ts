import type { types } from '@theatre/core';

/**
 * Type definition for a Theatre.js property transformer.
 *
 * Transformers are used to convert between Three.js property values and
 * Theatre.js animation values. This allows for proper representation
 * in the Theatre.js Studio UI (e.g., showing degrees instead of radians).
 *
 * Based on https://github.com/threlte/threlte/blob/main/packages/theatre/src/lib/sheetObject/transfomers/types.ts
 *
 * @typeParam Value - The type of the original Three.js property value
 * @typeParam TransformedValue - The type of the value used in Theatre.js
 *
 * @example
 * ```typescript
 * const myTransformer: TheatreTransformer<number, number> = {
 *   transform: (value) => types.number(value * 100),
 *   apply: (target, property, value) => { target[property] = value / 100; }
 * };
 * ```
 */
export type TheatreTransformer<Value = any, TransformedValue = any> = {
	/**
	 * The `transform` function is used to transform the value of a certain
	 * Three.js objects proerty to a property that Theatre.js can use in an
	 * `ISheetObject`. To ensure compatibility with the rest of the package, the
	 * return value must be any one of the functions available at Theatre.js'
	 * `types`.
	 */
	transform: (value: Value) => ReturnType<(typeof types)[keyof typeof types]>;
	/**
	 * The `apply` function is used to apply the value to the target. `target` is
	 * the parent object of the property (usually a Three.js object), `path` is
	 * the name of the property and `value` is the value to apply.
	 */
	apply: (target: any, property: string, value: TransformedValue) => void;
};

/**
 * Factory function for creating a Theatre.js transformer.
 *
 * This is a convenience function that provides type inference for transformer creation.
 *
 * @param transformer - The transformer configuration object
 * @returns The same transformer object (identity function with type inference)
 *
 * @example
 * ```typescript
 * import { createTransformer } from 'angular-three-theatre';
 * import { types } from '@theatre/core';
 *
 * export const percentage = createTransformer({
 *   transform: (value) => types.number(value * 100, { range: [0, 100] }),
 *   apply: (target, property, value) => { target[property] = value / 100; }
 * });
 * ```
 */
export function createTransformer(transformer: TheatreTransformer) {
	return transformer;
}
