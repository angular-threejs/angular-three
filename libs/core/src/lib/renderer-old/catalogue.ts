import { inject, InjectionToken } from '@angular/core';
import type { NgtConstructorRepresentation } from '../types';

const catalogue: Record<string, NgtConstructorRepresentation> = {};

export function extend(objects: object): void {
	Object.assign(catalogue, objects);
}

export const NGT_CATALOGUE = new InjectionToken<typeof catalogue>('NGT_CATALOGUE', { factory: () => catalogue });

export function injectCatalogue() {
	return inject(NGT_CATALOGUE);
}
