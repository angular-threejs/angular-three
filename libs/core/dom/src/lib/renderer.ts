import { makeEnvironmentProviders, RendererFactory2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { NGT_RENDERER_OPTIONS, NgtRendererFactory2, type NgtRendererFactory2Options } from 'angular-three';

/**
 * Provides the Angular Three renderer for use in a standalone application.
 *
 * This function should be called in your application's providers array to
 * enable Angular Three's custom renderer for Three.js elements.
 *
 * @param options - Optional renderer configuration
 * @returns Environment providers for the Angular Three renderer
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideNgtRenderer } from 'angular-three/dom';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgtRenderer(),
 *     // or with options:
 *     provideNgtRenderer({ verbose: true })
 *   ]
 * };
 * ```
 */
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
