import { makeEnvironmentProviders, RendererFactory2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { NgtRendererFactory2 } from 'angular-three';

export function provideNgtRenderer() {
	return makeEnvironmentProviders([
		{
			provide: RendererFactory2,
			useFactory: (domRendererFactory: RendererFactory2) => new NgtRendererFactory2(domRendererFactory),
			deps: [DomRendererFactory2],
		},
	]);
}
