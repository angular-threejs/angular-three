import { createInjectionToken } from './utils';

const catalogue: Record<string, new (...args: any[]) => any> = {};

export function extend(objects: object): void {
	Object.assign(catalogue, objects);
}

export const [injectNgtCatalogue, provideNgtCatalogue, NGT_CATALOGUE] = createInjectionToken(() => catalogue);

export const [injectNgtRoots, provideNgtRoots, NGT_ROOTS] = createInjectionToken(() => new Map());
