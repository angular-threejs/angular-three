import { inject, InjectionToken } from '@angular/core';
import type { NgtConstructorRepresentation } from '../types';

/**
 * @fileoverview Catalogue for registering Three.js constructors.
 *
 * The catalogue maps element names to their corresponding Three.js constructors,
 * allowing the custom renderer to instantiate objects when elements are created.
 */

const catalogue: Record<string, NgtConstructorRepresentation> = {};

/**
 * Registers Three.js constructors for use in templates.
 *
 * Call this function to make Three.js classes available for use as custom elements.
 * The function returns a cleanup function that removes the registered entries.
 *
 * @param objects - An object mapping names to Three.js constructors
 * @returns A cleanup function to remove the registered entries
 *
 * @example
 * ```typescript
 * import { extend } from 'angular-three';
 * import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
 *
 * // Register at component level
 * extend({ Mesh, BoxGeometry, MeshStandardMaterial });
 *
 * // Now you can use in templates:
 * // <ngt-mesh>
 * //   <ngt-box-geometry />
 * //   <ngt-mesh-standard-material />
 * // </ngt-mesh>
 * ```
 */
export function extend(objects: object) {
	const keys = Object.keys(objects);
	Object.assign(catalogue, objects);
	return () => {
		remove(...keys);
	};
}

/**
 * Removes entries from the catalogue by key.
 *
 * @param keys - The keys to remove from the catalogue
 */
export function remove(...keys: string[]) {
	for (const key of keys) {
		delete catalogue[key];
	}
}

/**
 * Injection token for the Three.js constructor catalogue.
 */
export const NGT_CATALOGUE = new InjectionToken<typeof catalogue>('NGT_CATALOGUE', { factory: () => catalogue });

/**
 * Injects the Three.js constructor catalogue.
 *
 * @returns The catalogue mapping names to constructors
 */
export function injectCatalogue() {
	return inject(NGT_CATALOGUE);
}
