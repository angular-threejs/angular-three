import { Signal, computed } from '@angular/core';
import { Vector2, Vector2Tuple, Vector3, Vector3Tuple } from 'three';
import { NgtVector2, NgtVector3 } from '../three-types';
import { NgtAnyRecord } from '../types';

type KeysOfType<TObject extends object, TType> = Exclude<
	{
		[K in keyof TObject]: TObject[K] extends TType | undefined | null ? K : never;
	}[keyof TObject],
	undefined
>;

export function omit<TObject extends object, TKeys extends (keyof TObject)[]>(
	objFn: () => TObject,
	keysToOmit: TKeys,
): Signal<Omit<TObject, TKeys[number]>>;
export function omit(objFn: () => NgtAnyRecord, keysToOmit: string[]) {
	return computed(() => {
		const obj = objFn();
		const result = {} as NgtAnyRecord;

		for (const key of Object.keys(obj)) {
			if (keysToOmit.includes(key)) continue;
			Object.assign(result, { [key]: obj[key] });
		}

		return result;
	});
}

export function pick<TObject extends object, TKey extends keyof TObject>(
	objFn: () => TObject,
	key: TKey,
): Signal<TObject[TKey]>;
export function pick<TObject extends object, TKeys extends (keyof TObject)[]>(
	objFn: () => TObject,
	keys: TKeys,
): Signal<Pick<TObject, TKeys[number]>>;
export function pick(objFn: () => NgtAnyRecord, keyOrKeys: string | string[]) {
	if (Array.isArray(keyOrKeys)) {
		return computed(() => {
			const obj = objFn();
			const result = {} as NgtAnyRecord;
			for (const key of keyOrKeys) {
				if (!(key in obj)) continue;
				Object.assign(result, { [key]: obj[key] });
			}
			return result;
		});
	}

	return computed(() => objFn()[keyOrKeys]);
}

export function merge<TObject extends object>(
	objFn: () => TObject,
	toMerge: Partial<TObject>,
	mode: 'override' | 'backfill' = 'override',
) {
	if (mode === 'override') return computed(() => ({ ...objFn(), ...toMerge }));
	return computed(() => ({ ...toMerge, ...objFn() }));
}

export function vector2<TObject extends object>(
	options: Signal<TObject>,
	key: KeysOfType<TObject, NgtVector2>,
): Signal<Vector2>;
export function vector2<TObject extends object>(
	options: Signal<TObject>,
	key: KeysOfType<TObject, NgtVector2>,
	keepUndefined: true,
): Signal<Vector2 | undefined>;
export function vector2(options: Signal<NgtAnyRecord>, key: string, keepUndefined = false) {
	return computed(
		() => {
			const value = options()[key];
			if (keepUndefined && value == undefined) return undefined;
			if (typeof value === 'number') return new Vector2(value, value);
			else if (value) return new Vector2(...(value as Vector2Tuple));
			else return new Vector2();
		},
		{ equal: (a, b) => !!a && !!b && a.equals(b) },
	);
}

export function vector3(input: Signal<NgtVector3>): Signal<Vector3>;
export function vector3(input: Signal<NgtVector3>, keepUndefined: true): Signal<Vector3>;
export function vector3<TObject extends object>(
	options: Signal<TObject>,
	key: KeysOfType<TObject, NgtVector3>,
): Signal<Vector3>;
export function vector3<TObject extends object>(
	options: Signal<TObject>,
	key: KeysOfType<TObject, NgtVector3>,
	keepUndefined: true,
): Signal<Vector3 | undefined>;
export function vector3(
	inputOrOptions: Signal<NgtAnyRecord> | Signal<NgtVector3>,
	keyOrKeepUndefined?: string | true,
	keepUndefined?: boolean,
) {
	if (typeof keyOrKeepUndefined === 'undefined' || typeof keyOrKeepUndefined === 'boolean') {
		keepUndefined = !!keyOrKeepUndefined;
		const input = inputOrOptions as Signal<NgtVector3>;
		return computed(
			() => {
				const value = input();
				if (keepUndefined && value == undefined) return undefined;
				if (typeof value === 'number') return new Vector3(value, value, value);
				else if (value) return new Vector3(...(value as Vector3Tuple));
				else return new Vector3();
			},
			{ equal: (a, b) => !!a && !!b && a.equals(b) },
		);
	}

	const options = inputOrOptions as Signal<NgtAnyRecord>;
	const key = keyOrKeepUndefined as string;

	return computed(
		() => {
			const value = options()[key];
			if (keepUndefined && value == undefined) return undefined;
			if (typeof value === 'number') return new Vector3(value, value, value);
			else if (value) return new Vector3(...(value as Vector3Tuple));
			else return new Vector3();
		},
		{ equal: (a, b) => !!a && !!b && a.equals(b) },
	);
}
