import { effect, Injector, Signal } from '@angular/core';
import { injectLoader, injectStore, is, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * @deprecated Use textureResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
function _injectTexture<TInput extends string[] | string | Record<string, string>>(
	input: () => TInput,
	{ onLoad, injector }: { onLoad?: (texture: THREE.Texture[]) => void; injector?: Injector } = {},
): Signal<NgtLoaderResults<TInput, THREE.Texture> | null> {
	return assertInjector(_injectTexture, injector, () => {
		const store = injectStore();
		const result = injectLoader(() => THREE.TextureLoader, input);

		effect(() => {
			const textures = result();
			if (!textures) return;
			const gl = store.snapshot.gl;
			if ('initTexture' in gl) {
				const array = Array.isArray(textures)
					? textures
					: is.three<THREE.Texture>(textures, 'isTexture')
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
	injectLoader.preload(() => THREE.TextureLoader, input);
};

export type NgtsTextureLoader = typeof _injectTexture;

/**
 * @deprecated Use textureResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectTexture: NgtsTextureLoader = _injectTexture;
