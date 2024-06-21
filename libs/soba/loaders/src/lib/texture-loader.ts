import { effect, Injector, Signal } from '@angular/core';
import { injectLoader, injectNgtStore, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { Texture, TextureLoader } from 'three';

function _injectTextureLoader<TInput extends string[] | string | Record<string, string>>(
	input: () => TInput,
	{ onLoad, injector }: { onLoad?: (texture: Texture[]) => void; injector?: Injector } = {},
): Signal<NgtLoaderResults<TInput, Texture> | null> {
	return assertInjector(_injectTextureLoader, injector, () => {
		const store = injectNgtStore();
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

_injectTextureLoader.preload = <TInput extends string[] | string | Record<string, string>>(input: () => TInput) => {
	injectLoader.preload(() => TextureLoader, input);
};

export type NgtsTextureLoader = typeof _injectTextureLoader;
export const injectTextureLoader: NgtsTextureLoader = _injectTextureLoader;
