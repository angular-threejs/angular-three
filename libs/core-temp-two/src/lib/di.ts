import type { NgtState } from './store';
import { createInjectionToken, type NgtSignalStore } from './utils';

const catalogue: Record<string, new (...args: any[]) => any> = {};

export function extend(objects: object): void {
	Object.assign(catalogue, objects);
}

export const [injectNgtCatalogue, provideNgtCatalogue, NGT_CATALOGUE] = createInjectionToken(() => catalogue);

type NgtCanvasElement = HTMLCanvasElement | OffscreenCanvas;
const roots: Map<NgtCanvasElement, NgtSignalStore<NgtState>> = new Map();
export const [injectNgtRoots, provideNgtRoots, NGT_ROOTS] = createInjectionToken(() => roots);
