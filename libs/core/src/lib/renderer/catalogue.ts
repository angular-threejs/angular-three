import { InjectionToken } from '@angular/core';
import { createInjectFn } from '../utils/token';

export type NgtAnyConstructor = new (...args: any[]) => any;

const catalogue: Record<string, NgtAnyConstructor> = {};

export function extend(objects: object): void {
	Object.assign(catalogue, objects);
}

export const NGT_CATALOGUE = new InjectionToken<Record<string, NgtAnyConstructor>>('NGT_CATALOGUE', {
	factory: () => catalogue,
});
export const injectNgtCatalogue = createInjectFn(NGT_CATALOGUE);
