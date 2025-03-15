import { types } from '@theatre/core';
import { createTransformer } from './transformer';

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
