import { Injector } from '@angular/core';
import { injectLoader } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { FBXLoader } from 'three-stdlib';
import { fbxResource } from './fbx-resource';

/**
 * Loads FBX models using the FBXLoader from three-stdlib.
 *
 * @deprecated Use fbxResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @param input - A function returning the URL(s) of the FBX file(s) to load
 * @param options - Configuration options
 * @param options.injector - Optional injector for dependency injection context
 * @returns A readonly signal containing the loaded FBX Group(s)
 */
function _injectFBX<TUrl extends string | string[] | Record<string, string>>(
	input: () => TUrl,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(_injectFBX, injector, () => {
		const resource = fbxResource(input, { injector });
		return resource.value.asReadonly();
	});
}

_injectFBX.preload = <TUrl extends string | string[] | Record<string, string>>(input: () => TUrl) => {
	injectLoader.preload(() => FBXLoader, input);
};

/**
 * Type definition for the injectFBX function, including its static preload method.
 *
 * @deprecated Use fbxResource instead. Will be removed in v5.0.0
 */
export type NgtsFBXLoader = typeof _injectFBX;

/**
 * Injectable function for loading FBX 3D models.
 *
 * Supports loading single files, arrays of files, or record objects mapping keys to URLs.
 * Includes a static `preload` method for preloading assets.
 *
 * @deprecated Use fbxResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @example
 * ```typescript
 * // Single file
 * const fbx = injectFBX(() => '/models/character.fbx');
 *
 * // Multiple files
 * const fbxs = injectFBX(() => ['/models/a.fbx', '/models/b.fbx']);
 *
 * // Preload
 * injectFBX.preload(() => '/models/character.fbx');
 * ```
 */
export const injectFBX: NgtsFBXLoader = _injectFBX;
