import { inject, InjectionToken } from '@angular/core';
import type { NgtConstructorRepresentation } from '../types';

const catalogue: Record<string, NgtConstructorRepresentation> = {};

export function extend(objects: object) {
	const keys = Object.keys(objects);
	Object.assign(catalogue, objects);
	return () => {
		remove(...keys);
	};
}

export function remove(...keys: string[]) {
	for (const key of keys) {
		delete catalogue[key];
	}
}

export const NGT_CATALOGUE = new InjectionToken<typeof catalogue>('NGT_CATALOGUE', { factory: () => catalogue });

export function injectCatalogue() {
	return inject(NGT_CATALOGUE);
}
