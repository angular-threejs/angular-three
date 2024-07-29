import { computed, Signal, Type } from '@angular/core';
import { Vector2, Vector3, Vector4 } from 'three';
import { NgtVector2, NgtVector3, NgtVector4 } from '../three-types';
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

type NgtVectorComputed<
	TVector extends Vector2 | Vector3 | Vector4,
	TNgtVector = TVector extends Vector2 ? NgtVector2 : TVector extends Vector3 ? NgtVector3 : NgtVector4,
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

function createVectorComputed<TVector extends Vector2 | Vector3 | Vector4>(vectorCtor: Type<TVector>) {
	type TNgtVector = TVector extends Vector2 ? NgtVector2 : TVector extends Vector3 ? NgtVector3 : NgtVector4;
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
					else if (value) return new vectorCtor(...(value as any));
					else return new vectorCtor();
				},
				{ equal: (a, b) => !!a && !!b && a.equals(b as any) },
			);
		}

		const options = inputOrOptions as Signal<NgtAnyRecord>;
		const key = keyOrKeepUndefined as string;

		return computed(
			() => {
				const value = options()[key];
				if (keepUndefined && value == undefined) return undefined;
				if (typeof value === 'number') return new vectorCtor().setScalar(value);
				else if (value) return new vectorCtor(...(value as any));
				else return new vectorCtor();
			},
			{ equal: (a, b) => !!a && !!b && a.equals(b as any) },
		);
	}) as NgtVectorComputed<TVector, TNgtVector>;
}

export const vector2 = createVectorComputed(Vector2);
export const vector3 = createVectorComputed(Vector3);
export const vector4 = createVectorComputed(Vector4);
