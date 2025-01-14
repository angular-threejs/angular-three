import { computed, Signal, Type, ValueEqualityFn } from '@angular/core';
import * as THREE from 'three';
import type { NgtVector2, NgtVector3, NgtVector4 } from '../three-types';
import type { NgtAnyRecord } from '../types';
import { is } from './is';

type KeysOfType<TObject extends object, TType> = Exclude<
	{
		[K in keyof TObject]: TObject[K] extends TType | undefined | null ? K : never;
	}[keyof TObject],
	undefined
>;

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

export const vector2 = createVectorComputed(THREE.Vector2);
export const vector3 = createVectorComputed(THREE.Vector3);
export const vector4 = createVectorComputed(THREE.Vector4);
