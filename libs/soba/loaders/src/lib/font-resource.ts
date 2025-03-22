import { Injector, resource } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { Font, FontLoader } from 'three-stdlib';

type Glyph = {
	_cachedOutline: string[];
	ha: number;
	o: string;
};

type FontData = {
	boundingBox: {
		yMax: number;
		yMin: number;
	};
	familyName: string;
	glyphs: {
		[k: string]: Glyph;
	};
	resolution: number;
	underlineThickness: number;
};

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

export function fontResource(input: () => NgtsFontInput, { injector }: { injector?: Injector } = {}) {
	return assertInjector(fontResource, injector, () => {
		return resource({
			request: input,
			loader: async ({ request }) => {
				if (cache.has(request)) {
					return cache.get(request) as Font;
				}

				const fontData = await loadFontData(request);
				const parsed = parseFontData(fontData);
				cache.set(request, parsed);
				return parsed;
			},
		});
	});
}

fontResource.preload = (input: NgtsFontInput) => {
	loadFontData(input).then((data) => {
		const parsed = parseFontData(data);
		cache.set(input, parsed);
	});
};

fontResource.clear = (input?: NgtsFontInput) => {
	if (input) {
		cache.delete(input);
	} else {
		cache.clear();
	}
};
