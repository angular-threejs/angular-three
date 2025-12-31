import { REVISION } from 'three';

/**
 * Retrieves the current THREE.js version as a numeric value.
 *
 * Parses the THREE.js REVISION constant, stripping any non-numeric characters
 * (e.g., 'r152' becomes 152).
 *
 * @returns The THREE.js version as an integer
 *
 * @example
 * ```typescript
 * if (getVersion() >= 150) {
 *   // Use features available in r150+
 * }
 * ```
 */
export function getVersion() {
	return parseInt(REVISION.replace(/\D+/g, ''));
}
