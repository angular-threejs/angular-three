import type * as THREE from 'three';

/**
 * NOTE: Sets `BufferAttribute.updateRange` since r159.
 */
export const setUpdateRange = (
	attribute: THREE.BufferAttribute,
	updateRange: { start: number; count: number },
): void => {
	if ('updateRanges' in attribute) {
		// attribute.updateRanges[0] = updateRange;
		attribute.addUpdateRange(updateRange.start, updateRange.count);
	} else {
		Object.assign(attribute, { updateRange });
	}
};
