import { computed, Signal, Type, ValueEqualityFn } from '@angular/core';
import * as THREE from 'three';
import type { NgtVector2, NgtVector3, NgtVector4 } from '../three-types';
import type { NgtAnyRecord } from '../types';
import { is } from './is';

/**
 * @fileoverview Signal utilities for transforming and accessing object properties.
 *
 * This module provides computed signal utilities for working with object properties,
 * including `omit`, `pick`, `merge`, and vector conversion functions.
 */

type KeysOfType<TObject extends object, TType> = Exclude<
	{
		[K in keyof TObject]: TObject[K] extends TType | undefined | null ? K : never;
	}[keyof TObject],
	undefined
>;

/**
 * Creates a computed signal that omits specified keys from an object.
 *
 * @typeParam TObject - The type of the source object
 * @typeParam TKeys - The keys to omit
 * @param objFn - Function returning the source object
 * @param keysToOmit - Array of keys to omit
 * @param equal - Optional equality function for change detection
 * @returns A signal containing the object without the omitted keys
 *
 * @example
 * ```typescript
 * const state = signal({ a: 1, b: 2, c: 3 });
 * const withoutB = omit(() => state(), ['b']);
 * // withoutB() => { a: 1, c: 3 }
 * ```
 */
export function omit<TObject extends object, TKeys extends (keyof TObject)[]>(
	objFn: () => TObject,
	keysToOmit: TKeys,
	equal: ValueEqualityFn<NoInfer<Omit<TObject, TKeys[number]>>> = (a, b) =>
		is.equ(a, b, { objects: 'shallow', arrays: 'shallow' }),
): Signal<Omit<TObject, TKeys[number]>> {
	return computed(
		() => {
			const obj = objFn();
			const result = {} as NgtAnyRecord;

			for (const key of Object.keys(obj)) {
				if (keysToOmit.includes(key as keyof TObject)) continue;
				Object.assign(result, { [key]: obj[key as keyof TObject] });
			}

			return result as Omit<TObject, TKeys[number]>;
		},
		{ equal },
	);
}

/**
 * Creates a computed signal that picks specified keys from an object.
 *
 * Can pick a single key (returning the value) or multiple keys (returning a partial object).
 *
 * @example
 * ```typescript
 * const state = signal({ a: 1, b: 2, c: 3 });
 *
 * // Pick single key
 * const a = pick(() => state(), 'a');
 * // a() => 1
 *
 * // Pick multiple keys
 * const ab = pick(() => state(), ['a', 'b']);
 * // ab() => { a: 1, b: 2 }
 * ```
 */
export function pick<TObject extends object, TKey extends keyof TObject>(
	objFn: () => TObject,
	key: TKey,
	equal?: ValueEqualityFn<NoInfer<TObject[TKey]>>,
): Signal<TObject[TKey]>;
export function pick<TObject extends object, TKeys extends (keyof TObject)[]>(
	objFn: () => TObject,
	keys: TKeys,
	equal?: ValueEqualityFn<NoInfer<Pick<TObject, TKeys[number]>>>,
): Signal<Pick<TObject, TKeys[number]>>;
export function pick(objFn: () => NgtAnyRecord, keyOrKeys: string | string[], equal?: ValueEqualityFn<any>) {
	if (Array.isArray(keyOrKeys)) {
		if (!equal) {
			equal = (a, b) => is.equ(a, b, { objects: 'shallow', arrays: 'shallow' });
		}

		return computed(
			() => {
				const obj = objFn();
				const result = {} as NgtAnyRecord;
				for (const key of keyOrKeys) {
					if (!(key in obj)) continue;
					Object.assign(result, { [key]: obj[key] });
				}
				return result;
			},
			{ equal },
		);
	}

	return computed(() => objFn()[keyOrKeys], { equal });
}

/**
 * Creates a computed signal that merges an object with static values.
 *
 * @param objFn - Function returning the source object
 * @param toMerge - Static values to merge
 * @param mode - 'override' (default) puts toMerge values on top, 'backfill' puts them underneath
 * @param equal - Optional equality function
 * @returns A signal containing the merged object
 *
 * @example
 * ```typescript
 * const options = signal({ size: 10 });
 * const withDefaults = merge(() => options(), { color: 'red' }, 'backfill');
 * // withDefaults() => { color: 'red', size: 10 }
 * ```
 */
export function merge<TObject extends object>(
	objFn: () => TObject,
	toMerge: Partial<TObject>,
	mode: 'override' | 'backfill' = 'override',
	equal: ValueEqualityFn<NoInfer<TObject>> = (a, b) => is.equ(a, b, { objects: 'shallow', arrays: 'shallow' }),
) {
	if (mode === 'override') return computed(() => ({ ...objFn(), ...toMerge }), { equal });
	return computed(() => ({ ...toMerge, ...objFn() }), { equal });
}

type NgtVectorComputed<
	TVector extends THREE.Vector2 | THREE.Vector3 | THREE.Vector4,
	TNgtVector = TVector extends THREE.Vector2 ? NgtVector2 : TVector extends THREE.Vector3 ? NgtVector3 : NgtVector4,
> = {
	(input: Signal<TNgtVector>): Signal<TVector>;
	(input: Signal<TNgtVector>, keepUndefined: true): Signal<TVector | undefined>;
	<TObject extends object>(options: Signal<TObject>, key: KeysOfType<TObject, TNgtVector>): Signal<TVector>;
	<TObject extends object>(
		options: Signal<TObject>,
		key: KeysOfType<TObject, TNgtVector>,
		keepUndefined: true,
	): Signal<TVector | undefined>;
};

function createVectorComputed<TVector extends THREE.Vector2 | THREE.Vector3 | THREE.Vector4>(
	vectorCtor: Type<TVector>,
) {
	type TNgtVector = TVector extends THREE.Vector2
		? NgtVector2
		: TVector extends THREE.Vector3
			? NgtVector3
			: NgtVector4;
	return ((
		inputOrOptions: Signal<NgtAnyRecord> | Signal<TNgtVector>,
		keyOrKeepUndefined?: string | true,
		keepUndefined?: boolean,
	) => {
		if (typeof keyOrKeepUndefined === 'undefined' || typeof keyOrKeepUndefined === 'boolean') {
			keepUndefined = !!keyOrKeepUndefined;
			const input = inputOrOptions as Signal<TNgtVector>;
			return computed(
				() => {
					const value = input();
					if (keepUndefined && value == undefined) return undefined;
					if (typeof value === 'number') return new vectorCtor().setScalar(value);
					else if (Array.isArray(value)) return new vectorCtor(...value);
					else if (value) return value as unknown as TVector;
					else return new vectorCtor();
				},
				{ equal: (a, b) => !!a && !!b && a.equals(b as any) },
			);
		}

		const options = inputOrOptions as Signal<NgtAnyRecord>;
		const key = keyOrKeepUndefined as string;

		return computed(
			() => {
				const value = options()[key] as TNgtVector;
				if (keepUndefined && value == undefined) return undefined;
				if (typeof value === 'number') return new vectorCtor().setScalar(value);
				else if (Array.isArray(value)) return new vectorCtor(...value);
				else if (value) return value as unknown as TVector;
				else return new vectorCtor();
			},
			{ equal: (a, b) => !!a && !!b && a.equals(b as any) },
		);
	}) as NgtVectorComputed<TVector, TNgtVector>;
}

/**
 * Creates a computed Vector2 signal from various input formats.
 *
 * Accepts: number (scalar), [x, y] array, or Vector2 instance.
 *
 * @example
 * ```typescript
 * const pos = vector2(input);
 * // or from options object
 * const pos = vector2(options, 'position');
 * ```
 */
export const vector2 = createVectorComputed(THREE.Vector2);

/**
 * Creates a computed Vector3 signal from various input formats.
 *
 * Accepts: number (scalar), [x, y, z] array, or Vector3 instance.
 *
 * @example
 * ```typescript
 * const pos = vector3(input);
 * // or from options object
 * const pos = vector3(options, 'position');
 * ```
 */
export const vector3 = createVectorComputed(THREE.Vector3);

/**
 * Creates a computed Vector4 signal from various input formats.
 *
 * Accepts: number (scalar), [x, y, z, w] array, or Vector4 instance.
 *
 * @example
 * ```typescript
 * const pos = vector4(input);
 * // or from options object
 * const pos = vector4(options, 'position');
 * ```
 */
export const vector4 = createVectorComputed(THREE.Vector4);
