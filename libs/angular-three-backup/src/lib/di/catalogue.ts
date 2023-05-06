import { InjectionToken } from '@angular/core';

const catalogue: Record<string, new (...args: any[]) => any> = {};

export function extend(objects: object): void {
    Object.assign(catalogue, objects);
}

export const NGT_CATALOGUE = new InjectionToken<Record<string, new (...args: any[]) => any>>(
    'THREE Constructors Catalogue',
    { factory: () => catalogue }
);
