import { ChangeDetectorRef, makeEnvironmentProviders, RendererFactory2 } from '@angular/core';
import { NgtStore } from '../stores/store';
import { NGT_COMPOUND_PREFIXES } from './di';
import { NgtRendererFactory } from './renderer';

export type NgtRendererProviderOptions = {
    store: NgtStore;
    changeDetectorRef: ChangeDetectorRef;
    compoundPrefixes?: string[];
};

export function provideNgtRenderer({ store, changeDetectorRef, compoundPrefixes = [] }: NgtRendererProviderOptions) {
    if (!compoundPrefixes.includes('ngts')) compoundPrefixes.push('ngts');
    if (!compoundPrefixes.includes('ngtp')) compoundPrefixes.push('ngtp');

    return makeEnvironmentProviders([
        { provide: RendererFactory2, useClass: NgtRendererFactory },
        { provide: NgtStore, useValue: store },
        { provide: ChangeDetectorRef, useValue: changeDetectorRef },
        { provide: NGT_COMPOUND_PREFIXES, useValue: compoundPrefixes },
    ]);
}
