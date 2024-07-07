import { createInjectionToken } from 'ngxtension/create-injection-token';

export type NgtAnyConstructor = new (...args: any[]) => any;

const catalogue: Record<string, NgtAnyConstructor> = {};

export function extend(objects: object): void {
	Object.assign(catalogue, objects);
}

export const [injectCatalogue] = createInjectionToken(() => catalogue);
