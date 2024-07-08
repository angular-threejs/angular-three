import { effect, Injector, signal, untracked } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { Font, FontLoader } from 'three-stdlib';

export type Glyph = {
	_cachedOutline: string[];
	ha: number;
	o: string;
};

export type FontData = {
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

export function injectFont(input: () => NgtsFontInput, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectFont, injector, () => {
		const font = signal<Font | null>(null);

		effect(() => {
			const fontInput = input();

			if (cache.has(fontInput)) {
				untracked(() => {
					font.set(cache.get(fontInput) as Font);
				});
				return;
			}

			loadFontData(input()).then((data) => {
				const parsed = parseFontData(data);
				cache.set(fontInput, parsed);
				font.set(parsed);
			});
		});

		return font.asReadonly();
	});
}

injectFont.preload = (input: () => NgtsFontInput) => {
	loadFontData(input()).then((data) => {
		const parsed = parseFontData(data);
		cache.set(input(), parsed);
	});
};
injectFont.clear = (input?: () => NgtsFontInput) => {
	if (input) {
		cache.delete(input());
	} else {
		cache.clear();
	}
};
