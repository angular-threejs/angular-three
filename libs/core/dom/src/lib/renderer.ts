import { makeEnvironmentProviders, RendererFactory2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { NGT_RENDERER_OPTIONS, NgtRendererFactory2, type NgtRendererFactory2Options } from 'angular-three';

export function provideNgtRenderer(options: NgtRendererFactory2Options = {}) {
	return makeEnvironmentProviders([
		{ provide: NGT_RENDERER_OPTIONS, useValue: options },
		{
			provide: RendererFactory2,
			useFactory: (domRendererFactory: RendererFactory2) => new NgtRendererFactory2(domRendererFactory),
			deps: [DomRendererFactory2],
		},
	]);
}
