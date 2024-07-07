import { effect, Injector, Signal } from '@angular/core';
import { injectLoader, injectStore, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { Texture, TextureLoader } from 'three';

function _injectTexture<TInput extends string[] | string | Record<string, string>>(
	input: () => TInput,
	{ onLoad, injector }: { onLoad?: (texture: Texture[]) => void; injector?: Injector } = {},
): Signal<NgtLoaderResults<TInput, Texture> | null> {
	return assertInjector(_injectTexture, injector, () => {
		const store = injectStore();
		const result = injectLoader(() => TextureLoader, input);

		effect(() => {
			const textures = result();
			if (!textures) return;
			const gl = store.get('gl');
			if ('initTexture' in gl) {
				const array = Array.isArray(textures)
					? textures
					: textures instanceof Texture
						? [textures]
						: Object.values(textures);
				if (onLoad) onLoad(array);
				array.forEach(gl.initTexture.bind(gl));
			}
		});

		return result;
	});
}

_injectTexture.preload = <TInput extends string[] | string | Record<string, string>>(input: () => TInput) => {
	injectLoader.preload(() => TextureLoader, input);
};

export type NgtsTextureLoader = typeof _injectTexture;
export const injectTexture: NgtsTextureLoader = _injectTexture;
