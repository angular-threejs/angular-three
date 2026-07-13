import { makeEnvironmentProviders, RendererFactory2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { NGT_RENDERER_OPTIONS, NgtRendererFactory2, type NgtRendererFactory2Options } from 'angular-three';

/**
 * Angular does not expose the platform DOM renderer factory through a public injection token.
 * Injecting `RendererFactory2` here would resolve this provider recursively, so the private
 * `ɵDomRendererFactory2` symbol is deliberately quarantined to this browser-only composition file.
 * The production-wiring tests cover Emulated and host-bound Shadow DOM delegates so Angular
 * upgrades fail at this boundary instead of leaking private APIs into the renderer core.
 */
const DOM_RENDERER_FACTORY = DomRendererFactory2;

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
			deps: [DOM_RENDERER_FACTORY],
		},
	]);
}
