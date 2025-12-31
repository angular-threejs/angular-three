import { effect, Injector } from '@angular/core';
import { injectStore, is, loaderResource, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * Creates a resource for loading texture images using Angular's resource API.
 *
 * This function wraps THREE.TextureLoader and provides a reactive resource-based
 * approach to loading textures. Loaded textures are automatically initialized
 * with the WebGL renderer for optimal performance.
 *
 * Supports loading single textures, arrays of textures, or record objects mapping
 * keys to URLs.
 *
 * @param input - Signal of the URL(s) of the texture(s) to load
 * @param options - Configuration options
 * @param options.onLoad - Callback fired when textures are loaded
 * @param options.injector - Optional injector for dependency injection context
 * @returns A ResourceRef containing the loaded texture(s)
 *
 * @example
 * ```typescript
 * // Single texture
 * const texture = textureResource(() => '/textures/diffuse.jpg');
 *
 * // Multiple textures
 * const textures = textureResource(() => ['/textures/diffuse.jpg', '/textures/normal.jpg']);
 *
 * // Named textures
 * const maps = textureResource(() => ({
 *   diffuse: '/textures/diffuse.jpg',
 *   normal: '/textures/normal.jpg'
 * }));
 *
 * // With onLoad callback
 * const texture = textureResource(() => '/textures/diffuse.jpg', {
 *   onLoad: (tex) => console.log('Texture loaded:', tex)
 * });
 * ```
 */
export function textureResource<TUrl extends string[] | string | Record<string, string>>(
	input: () => TUrl,
	{
		onLoad,
		injector,
	}: {
		/** Callback fired when textures are loaded */
		onLoad?: (result: NgtLoaderResults<TUrl, THREE.Texture>) => void;
		/** Optional injector for DI context */
		injector?: Injector;
	} = {},
) {
	return assertInjector(textureResource, injector, () => {
		const store = injectStore();
		const resource = loaderResource(() => THREE.TextureLoader, input);

		effect(() => {
			if (!resource.hasValue()) return;
			const result = resource.value();

			if (onLoad) onLoad(result);

			const gl = store.snapshot.gl;
			if ('initTexture' in gl) {
				let textures: THREE.Texture[];

				if (Array.isArray(result)) {
					textures = result;
				} else if (is.three<THREE.Texture>(result, 'isTexture')) {
					textures = [result];
				} else {
					textures = Object.values(result);
				}

				textures.forEach(gl.initTexture.bind(gl));
			}
		});

		return resource;
	});
}

/**
 * Preloads textures into the cache for faster subsequent loading.
 *
 * @param input - The URL(s) of the texture(s) to preload
 *
 * @example
 * ```typescript
 * // Preload a single texture
 * textureResource.preload('/textures/diffuse.jpg');
 *
 * // Preload multiple textures
 * textureResource.preload(['/textures/diffuse.jpg', '/textures/normal.jpg']);
 * ```
 */
textureResource.preload = <TUrl extends string[] | string | Record<string, string>>(input: TUrl) => {
	loaderResource.preload(THREE.TextureLoader, input);
};
