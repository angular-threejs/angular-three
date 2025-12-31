import { Injector } from '@angular/core';
import { loaderResource } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { FBXLoader } from 'three-stdlib';

/**
 * Creates a resource for loading FBX 3D models using Angular's resource API.
 *
 * This function wraps the FBXLoader from three-stdlib and provides a reactive
 * resource-based approach to loading FBX files. It supports loading single files,
 * arrays of files, or record objects mapping keys to URLs.
 *
 * @param input - A function returning the URL(s) of the FBX file(s) to load
 * @param options - Configuration options
 * @param options.injector - Optional injector for dependency injection context
 * @returns A ResourceRef containing the loaded FBX Group(s)
 *
 * @example
 * ```typescript
 * // Single file
 * const fbx = fbxResource(() => '/models/character.fbx');
 * // Access: fbx.value()
 *
 * // Multiple files
 * const fbxs = fbxResource(() => ['/models/a.fbx', '/models/b.fbx']);
 *
 * // Named files
 * const models = fbxResource(() => ({ hero: '/models/hero.fbx', enemy: '/models/enemy.fbx' }));
 * ```
 */
export function fbxResource<TUrl extends string | string[] | Record<string, string>>(
	input: () => TUrl,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(fbxResource, injector, () => {
		return loaderResource(() => FBXLoader, input);
	});
}

/**
 * Preloads FBX models into the cache for faster subsequent loading.
 *
 * @param input - The URL(s) of the FBX file(s) to preload
 *
 * @example
 * ```typescript
 * // Preload a single model
 * fbxResource.preload('/models/character.fbx');
 *
 * // Preload multiple models
 * fbxResource.preload(['/models/a.fbx', '/models/b.fbx']);
 * ```
 */
fbxResource.preload = <TUrl extends string | string[] | Record<string, string>>(input: TUrl) => {
	loaderResource.preload(FBXLoader, input);
};
