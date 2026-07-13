import { inject, InjectionToken } from '@angular/core';
import type { NgtConstructorRepresentation } from '../types';

/**
 * @fileoverview Catalogue for registering Three.js constructors.
 *
 * The catalogue maps element names to their corresponding Three.js constructors,
 * allowing the custom renderer to instantiate objects when elements are created.
 */

const catalogue: Record<string, NgtConstructorRepresentation> = {};

interface CatalogueRegistration {
	value: NgtConstructorRepresentation;
	count: number;
}

interface CatalogueOwnership {
	baseline: NgtConstructorRepresentation | undefined;
	hadBaseline: boolean;
	registrations: CatalogueRegistration[];
}

const catalogueOwnership = new Map<string, CatalogueOwnership>();

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
	const registrations = Object.entries(objects).map(([key, value]) => {
		let ownership = catalogueOwnership.get(key);
		if (!ownership) {
			ownership = {
				baseline: catalogue[key],
				hadBaseline: Object.prototype.hasOwnProperty.call(catalogue, key),
				registrations: [],
			};
			catalogueOwnership.set(key, ownership);
		}

		const registrationValue = value as NgtConstructorRepresentation;
		let registration = ownership.registrations.at(-1);
		if (!registration || registration.value !== registrationValue) {
			registration = { value: registrationValue, count: 0 };
			ownership.registrations.push(registration);
		}
		// Repeated component-level extend calls commonly register the same Three
		// constructor. Coalesce those owners so the catalogue retains one layer,
		// not one record per component instance.
		registration.count++;
		catalogue[key] = registration.value;

		return { key, ownership, registration };
	});

	let cleaned = false;
	return () => {
		if (cleaned) return;
		cleaned = true;

		for (const { key, ownership, registration } of registrations) {
			// A public remove followed by a new extend starts a new ownership era. An
			// older cleanup must never affect that newer registration.
			if (catalogueOwnership.get(key) !== ownership) continue;

			registration.count--;
			if (registration.count > 0) continue;

			const registrationIndex = ownership.registrations.indexOf(registration);
			if (registrationIndex === -1) continue;
			ownership.registrations.splice(registrationIndex, 1);

			const activeRegistration = ownership.registrations.at(-1);
			if (activeRegistration) {
				catalogue[key] = activeRegistration.value;
				continue;
			}

			catalogueOwnership.delete(key);
			if (ownership.hadBaseline) {
				catalogue[key] = ownership.baseline as NgtConstructorRepresentation;
			} else {
				delete catalogue[key];
			}
		}
	};
}

/**
 * Removes entries from the catalogue by key.
 *
 * @param keys - The keys to remove from the catalogue
 */
export function remove(...keys: string[]) {
	for (const key of keys) {
		// Explicit removal is authoritative. Invalidate all outstanding cleanup
		// tokens so they cannot restore an older value later.
		catalogueOwnership.delete(key);
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
