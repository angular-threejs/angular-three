import { Injector, resource } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { Font } from 'three-stdlib';
import { loadFontData, NgtsFontInput, parseFontData } from './font-loader';

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
