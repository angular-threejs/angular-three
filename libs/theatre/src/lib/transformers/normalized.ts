import { types } from '@theatre/core';
import { createTransformer } from './transformer';

export const normalized = createTransformer({
	transform(value) {
		return types.number(value, { range: [0, 1] });
	},
	apply(target, path, value) {
		target[path] = value;
	},
});
