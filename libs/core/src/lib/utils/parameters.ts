import { Signal, computed } from '@angular/core';
import { Vector2, Vector2Tuple, Vector3, Vector3Tuple } from 'three';
import { NgtVector2, NgtVector3 } from '../three-types';
import { NgtAnyRecord } from '../types';

export type Excluded<TOptions extends object, TKeys extends (keyof TOptions)[]> = {
	[K in Exclude<keyof TOptions, TKeys[number]>]: TOptions[K];
};

export function exclude<TOptions extends object, TKeys extends (keyof TOptions)[]>(
	options: () => TOptions,
	keysToExclude: TKeys,
): Signal<Excluded<TOptions, TKeys>> {
	return computed(() => {
		const opts = options();
		return Object.keys(opts).reduce((acc, key) => {
			const optKey = key as keyof TOptions;
			if (!keysToExclude.includes(optKey)) {
				acc[optKey] = opts[optKey];
			}
			return acc;
		}, {} as TOptions);
	});
}

export type Picked<TOptions extends object, TKeyOption extends (keyof TOptions)[]> = {
	[K in TKeyOption[number]]: TOptions[K];
};

export function pick<TOptions extends object, TKeyOption extends keyof TOptions | (keyof TOptions)[]>(
	options: () => TOptions,
	keys: TKeyOption,
): TKeyOption extends keyof TOptions
	? Signal<TOptions[TKeyOption]>
	: TKeyOption extends (keyof TOptions)[]
		? Signal<Picked<TOptions, TKeyOption>>
		: never {
	if (Array.isArray(keys)) {
		return computed(() => {
			const opts = options();
			return keys.reduce((acc, key) => {
				// @ts-expect-error - fix this later
				acc[key] = opts[key];
				return acc;
			}, {} as NgtAnyRecord);
		}) as TKeyOption extends keyof TOptions
			? Signal<TOptions[TKeyOption]>
			: TKeyOption extends (keyof TOptions)[]
				? Signal<Picked<TOptions, TKeyOption>>
				: never;
	}

	return computed(() => options()[keys as keyof TOptions]) as TKeyOption extends keyof TOptions
		? Signal<TOptions[TKeyOption]>
		: TKeyOption extends (keyof TOptions)[]
			? Signal<Picked<TOptions, TKeyOption>>
			: never;
}

export function merge<TOptions extends object>(
	options: () => TOptions,
	toMerge: Partial<TOptions>,
	mode: 'override' | 'backfill' = 'override',
) {
	return computed(() => {
		const opts = options();
		return mode === 'override' ? { ...opts, ...toMerge } : { ...toMerge, ...opts };
	});
}

type KeysOfType<TObject extends object, TType> = Exclude<
	{
		[K in keyof TObject]: TObject[K] extends TType | undefined | null ? K : never;
	}[keyof TObject],
	undefined
>;

export function vector2<TObject extends object>(options: Signal<TObject>, key: KeysOfType<TObject, NgtVector2>) {
	return computed(() => {
		const value = options()[key];
		if (typeof value === 'number') return new Vector2(value, value);
		else if (value) return new Vector2(...(value as Vector2Tuple));
		else return new Vector2();
	});
}

export function vector3<TObject extends object>(options: Signal<TObject>, key: KeysOfType<TObject, NgtVector3>) {
	return computed(() => {
		const value = options()[key];
		if (typeof value === 'number') return new Vector3(value, value, value);
		else if (value) return new Vector3(...(value as Vector3Tuple));
		else return new Vector3();
	});
}
