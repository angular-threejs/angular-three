import { color } from './color';
import { degrees } from './degrees';
import { euler } from './euler';
import { generic } from './generic';
import { normalized } from './normalized';
import { side } from './side';

/**
 * Checks if a property path matches a pattern exactly or ends with the pattern.
 *
 * @param fullPropertyPath - The full property path (e.g., 'material.opacity')
 * @param pattern - The pattern to match (e.g., 'opacity')
 * @returns True if the path matches or ends with the pattern
 */
function isFullOrEndingPattern(fullPropertyPath: string, pattern: string) {
	return fullPropertyPath.endsWith(`.${pattern}`) || fullPropertyPath === pattern;
}

/**
 * Determines the appropriate transformer for a Three.js property based on its type and path.
 *
 * This function automatically selects the best transformer for common Three.js properties:
 * - Euler rotations → `euler` transformer (degrees display)
 * - Color values → `color` transformer (RGBA picker)
 * - Rotation components (x, y, z) → `degrees` transformer
 * - Color components (r, g, b) → `normalized` transformer (0-1 range)
 * - Material properties (opacity, roughness, metalness, transmission) → `normalized` transformer
 * - Side property → `side` transformer (Front/Back/Double switch)
 * - All others → `generic` transformer
 *
 * @param target - The parent object containing the property
 * @param path - The property name on the target
 * @param fullPropertyPath - The full dot-notation path to the property
 * @returns The appropriate transformer for the property
 *
 * @example
 * ```typescript
 * import { getDefaultTransformer } from 'angular-three-theatre';
 *
 * const mesh = new THREE.Mesh();
 * const transformer = getDefaultTransformer(mesh, 'rotation', 'rotation');
 * // Returns the euler transformer
 * ```
 */
export function getDefaultTransformer(target: any, path: string, fullPropertyPath: string) {
	const property = target[path];

	if (property.isEuler) return euler;
	if (property.isColor) return color;

	if (
		isFullOrEndingPattern(fullPropertyPath, 'rotation.x') ||
		isFullOrEndingPattern(fullPropertyPath, 'rotation.y') ||
		isFullOrEndingPattern(fullPropertyPath, 'rotation.z') ||
		(target.isEuler && (fullPropertyPath === 'x' || fullPropertyPath === 'y' || fullPropertyPath === 'z'))
	) {
		return degrees;
	}

	if (isFullOrEndingPattern(fullPropertyPath, 'r')) return normalized;
	if (isFullOrEndingPattern(fullPropertyPath, 'g')) return normalized;
	if (isFullOrEndingPattern(fullPropertyPath, 'b')) return normalized;

	if (isFullOrEndingPattern(fullPropertyPath, 'opacity')) return normalized;
	if (isFullOrEndingPattern(fullPropertyPath, 'roughness')) return normalized;
	if (isFullOrEndingPattern(fullPropertyPath, 'metalness')) return normalized;
	if (isFullOrEndingPattern(fullPropertyPath, 'transmission')) return normalized;

	if (isFullOrEndingPattern(fullPropertyPath, 'side')) return side;

	return generic;
}
