import { effect, Injector, type Signal } from '@angular/core';
import { injectNgtLoader, injectNgtStore, type NgtLoaderResults } from 'angular-three-old';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

function _injectNgtsTextureLoader<TInput extends string[] | string | Record<string, string>>(
	input: () => TInput,
	{
		onLoad,
		injector,
	}: {
		onLoad?: (texture: THREE.Texture | THREE.Texture[]) => void;
		injector?: Injector;
	} = {},
): Signal<NgtLoaderResults<TInput, THREE.Texture> | null> {
	return assertInjector(_injectNgtsTextureLoader, injector, () => {
		const store = injectNgtStore();
		const result = injectNgtLoader(() => THREE.TextureLoader, input);

		effect(() => {
			const textures = result();
			if (!textures) return;
			const gl = store.get('gl');
			if ('initTexture' in gl) {
				const array = Array.isArray(textures)
					? textures
					: textures instanceof THREE.Texture
						? [textures]
						: Object.values(textures);
				if (onLoad) onLoad(array);
				array.forEach(store.get('gl').initTexture);
			}
		});

		return result;
	});
}

_injectNgtsTextureLoader.preload = <TInput extends string[] | string | Record<string, string>>(input: () => TInput) => {
	injectNgtLoader.preload(() => THREE.TextureLoader, input);
};

export type NgtsTextureLoader = typeof _injectNgtsTextureLoader;
export const injectNgtsTextureLoader: NgtsTextureLoader = _injectNgtsTextureLoader;
