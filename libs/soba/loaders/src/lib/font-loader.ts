import { Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { fontResource, type NgtsFontInput } from './font-resource';

/**
 * Injectable function for loading font files for use with TextGeometry.
 *
 * Loads JSON font files (typeface.js format) or accepts pre-loaded font data.
 * Includes static `preload` and `clear` methods for cache management.
 *
 * @deprecated Use fontResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @param input - A function returning the font URL or font data object
 * @param options - Configuration options
 * @param options.injector - Optional injector for dependency injection context
 * @returns A readonly signal containing the loaded Font instance
 *
 * @example
 * ```typescript
 * // Load font from URL
 * const font = injectFont(() => '/fonts/helvetiker_regular.typeface.json');
 *
 * // Preload font
 * injectFont.preload(() => '/fonts/helvetiker_regular.typeface.json');
 *
 * // Clear cached font
 * injectFont.clear(() => '/fonts/helvetiker_regular.typeface.json');
 * ```
 */
export function injectFont(input: () => NgtsFontInput, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectFont, injector, () => {
		const resource = fontResource(input, { injector });
		return resource.value.asReadonly();
	});
}

/**
 * Preloads a font into the cache for faster subsequent loading.
 *
 * @param input - A function returning the font URL or font data to preload
 */
injectFont.preload = (input: () => NgtsFontInput) => {
	fontResource.preload(input());
};

/**
 * Clears cached font data.
 *
 * @param input - Optional function returning the font to clear. If not provided, clears all cached fonts.
 */
injectFont.clear = (input?: () => NgtsFontInput) => {
	fontResource.clear(input?.());
};
