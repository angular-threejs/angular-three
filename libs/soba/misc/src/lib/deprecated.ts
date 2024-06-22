import { BufferAttribute } from 'three';

/**
 * NOTE: Sets `BufferAttribute.updateRange` since r159.
 */
export const setUpdateRange = (attribute: BufferAttribute, updateRange: { offset: number; count: number }): void => {
	if ('updateRanges' in attribute) {
		// @ts-expect-error - r159
		attribute.updateRanges[0] = updateRange;
	} else {
		Object.assign(attribute, { updateRange });
	}
};

export const LinearEncoding = 3000;
export const sRGBEncoding = 3001;

/**
 * NOTE: TextureEncoding was deprecated in r152, and removed in r162.
 */
export type TextureEncoding = typeof LinearEncoding | typeof sRGBEncoding;
