import { computed } from '@angular/core';

export function makeParameters<TOptions extends object>(
	options: () => TOptions,
	keysToExclude: (keyof TOptions)[] = [],
) {
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
