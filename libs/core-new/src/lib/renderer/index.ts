import { RendererFactory2, makeEnvironmentProviders } from '@angular/core';
import { NgtState, provideStore } from '../store';
import { NgtSignalStore } from '../utils/signal-store';
import { NgtRendererFactory } from './renderer';

export function provideRenderer(store: NgtSignalStore<NgtState>) {
	const providers = [
		NgtRendererFactory,
		{ provide: RendererFactory2, useExisting: NgtRendererFactory },
		provideStore(store),
	];

	return makeEnvironmentProviders(providers);
}

export * from './catalogue';
