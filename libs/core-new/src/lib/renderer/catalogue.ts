import { InjectionToken } from '@angular/core';
import { NgtAnyRecord } from '../types';
import { createInjectFn } from '../utils/token';

export type NgtAnyConstructor = new (...args: any[]) => any;

const catalogue: Record<string, NgtAnyConstructor> = {};

export function extend(obj: NgtAnyRecord) {
	Object.assign(catalogue, obj);
}

export const NGT_CATALOGUE = new InjectionToken<typeof catalogue>('NGT_CATALOGUE', { factory: () => catalogue });
export const injectCatalogue = createInjectFn(NGT_CATALOGUE);
