import { createInjectionToken } from './utils/create-injection-token';

export type NgtCanvasElement = HTMLCanvasElement | OffscreenCanvas;

const roots = new Map<NgtCanvasElement, any>();
export const [injectNgtRoots, , NGT_ROOTS] = createInjectionToken(() => roots);
