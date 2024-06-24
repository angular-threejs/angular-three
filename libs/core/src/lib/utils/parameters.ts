import { Signal, computed } from '@angular/core';
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
