import type * as THREE from 'three';

/**
 * Sets the update range on a BufferAttribute for partial GPU uploads.
 *
 * Handles the API change in THREE.js r159 where `updateRange` was replaced
 * with `updateRanges` array and `addUpdateRange()` method.
 *
 * @deprecated This function handles legacy THREE.js API compatibility.
 * Consider using `attribute.addUpdateRange()` directly for r159+.
 *
 * @param attribute - The BufferAttribute to update
 * @param updateRange - Object specifying the range to update
 * @param updateRange.start - Starting index in the attribute array
 * @param updateRange.count - Number of elements to update
 *
 * @example
 * ```typescript
 * const positions = geometry.attributes['position'];
 * // Only update first 100 vertices
 * setUpdateRange(positions, { start: 0, count: 100 * 3 });
 * positions.needsUpdate = true;
 * ```
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
