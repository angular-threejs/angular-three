import { effect, Injector, Signal } from '@angular/core';
import { injectNgtLoader, injectNgtStore, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { Texture, TextureLoader } from 'three';

function _injectNgtsTextureLoader<TInput extends string[] | string | Record<string, string>>(
	input: () => TInput,
	{ onLoad, injector }: { onLoad?: (texture: Texture[]) => void; injector?: Injector } = {},
): Signal<NgtLoaderResults<TInput, Texture> | null> {
	return assertInjector(_injectNgtsTextureLoader, injector, () => {
		const store = injectNgtStore();
		const result = injectNgtLoader(() => TextureLoader, input);

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

_injectNgtsTextureLoader.preload = <TInput extends string[] | string | Record<string, string>>(input: () => TInput) => {
	injectNgtLoader.preload(() => TextureLoader, input);
};

export type NgtsTextureLoader = typeof _injectNgtsTextureLoader;
export const injectNgtsTextureLoader: NgtsTextureLoader = _injectNgtsTextureLoader;
