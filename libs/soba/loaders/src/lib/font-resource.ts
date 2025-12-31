import { Injector, resource } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { Font, FontLoader } from 'three-stdlib';

/**
 * Represents a single glyph in a font.
 */
type Glyph = {
	/** Cached outline paths for the glyph */
	_cachedOutline: string[];
	/** Horizontal advance width */
	ha: number;
	/** Outline path data */
	o: string;
};

/**
 * Font data structure compatible with typeface.js format.
 */
type FontData = {
	/** Bounding box dimensions */
	boundingBox: {
		/** Maximum Y coordinate */
		yMax: number;
		/** Minimum Y coordinate */
		yMin: number;
	};
	/** Font family name */
	familyName: string;
	/** Map of character codes to glyph data */
	glyphs: {
		[k: string]: Glyph;
	};
	/** Font resolution in units per em */
	resolution: number;
	/** Thickness of underline stroke */
	underlineThickness: number;
};

/**
 * Input type for font loading functions.
 * Can be either a URL string pointing to a typeface.js JSON file,
 * or a pre-loaded FontData object.
 */
export type NgtsFontInput = string | FontData;

let fontLoader: FontLoader | null = null;

async function loadFontData(font: NgtsFontInput): Promise<FontData> {
	return typeof font === 'string' ? await (await fetch(font)).json() : font;
}

function parseFontData(fontData: FontData) {
	if (!fontLoader) {
		fontLoader = new FontLoader();
	}
	return fontLoader.parse(fontData);
}

const cache = new Map<NgtsFontInput, Font>();

/**
 * Creates a resource for loading font files for use with Three.js TextGeometry.
 *
 * This function provides a reactive resource-based approach to loading fonts.
 * It supports loading from URLs (typeface.js JSON format) or pre-loaded font data.
 * Results are cached for efficient reuse.
 *
 * @param input - Signal of the font URL or font data object
 * @param options - Configuration options
 * @param options.injector - Optional injector for dependency injection context
 * @returns A ResourceRef containing the loaded Font instance
 *
 * @example
 * ```typescript
 * // Load font from URL
 * const font = fontResource(() => '/fonts/helvetiker_regular.typeface.json');
 *
 * // Use in template or effect
 * effect(() => {
 *   const f = font.value();
 *   if (f) {
 *     const geometry = new TextGeometry('Hello', { font: f, size: 1 });
 *   }
 * });
 * ```
 */
export function fontResource(input: () => NgtsFontInput, { injector }: { injector?: Injector } = {}) {
	return assertInjector(fontResource, injector, () => {
		return resource({
			params: input,
			loader: async ({ params }) => {
				if (cache.has(params)) {
					return cache.get(params) as Font;
				}

				const fontData = await loadFontData(params);
				const parsed = parseFontData(fontData);
				cache.set(params, parsed);
				return parsed;
			},
		});
	});
}

/**
 * Preloads a font into the cache for faster subsequent loading.
 *
 * @param input - The font URL or font data to preload
 *
 * @example
 * ```typescript
 * // Preload font before component renders
 * fontResource.preload('/fonts/helvetiker_regular.typeface.json');
 * ```
 */
fontResource.preload = (input: NgtsFontInput) => {
	loadFontData(input).then((data) => {
		const parsed = parseFontData(data);
		cache.set(input, parsed);
	});
};

/**
 * Clears cached font data.
 *
 * @param input - Optional font URL or data to clear from cache.
 *                If not provided, clears all cached fonts.
 *
 * @example
 * ```typescript
 * // Clear specific font
 * fontResource.clear('/fonts/helvetiker_regular.typeface.json');
 *
 * // Clear all cached fonts
 * fontResource.clear();
 * ```
 */
fontResource.clear = (input?: NgtsFontInput) => {
	if (input) {
		cache.delete(input);
	} else {
		cache.clear();
	}
};
