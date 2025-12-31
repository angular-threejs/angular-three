import { effect, Injector, Signal } from '@angular/core';
import { injectLoader, injectStore, is, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * Loads texture images using THREE.TextureLoader.
 *
 * @deprecated Use textureResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @param input - Signal of the URL(s) of the texture(s) to load
 * @param options - Configuration options
 * @param options.onLoad - Callback fired when textures are loaded
 * @param options.injector - Optional injector for dependency injection context
 * @returns A signal containing the loaded texture(s)
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

/**
 * Type definition for the injectTexture function, including its static preload method.
 *
 * @deprecated Use textureResource instead. Will be removed in v5.0.0
 */
export type NgtsTextureLoader = typeof _injectTexture;

/**
 * Injectable function for loading texture images.
 *
 * Loads textures using THREE.TextureLoader and automatically initializes them
 * with the WebGL renderer for optimal performance. Supports loading single textures,
 * arrays of textures, or record objects mapping keys to URLs.
 *
 * Includes a static `preload` method for preloading textures.
 *
 * @deprecated Use textureResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @example
 * ```typescript
 * // Single texture
 * const texture = injectTexture(() => '/textures/diffuse.jpg');
 *
 * // Multiple textures
 * const textures = injectTexture(() => ['/textures/diffuse.jpg', '/textures/normal.jpg']);
 *
 * // Named textures
 * const maps = injectTexture(() => ({
 *   diffuse: '/textures/diffuse.jpg',
 *   normal: '/textures/normal.jpg'
 * }));
 *
 * // Preload
 * injectTexture.preload(() => '/textures/diffuse.jpg');
 * ```
 */
export const injectTexture: NgtsTextureLoader = _injectTexture;
