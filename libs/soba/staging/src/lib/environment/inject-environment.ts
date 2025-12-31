import { Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import {
	environmentResource,
	type NgtsEnvironmentPresets,
	type NgtsEnvironmentResourceOptions,
} from './environment-resource';

/**
 * Injects an environment texture resource into the current injection context.
 *
 * @deprecated Use `environmentResource` instead. Will be removed in v5.0.0.
 * @since v4.0.0
 *
 * @param options - Signal of environment resource options
 * @param config - Configuration object with optional injector
 * @returns A signal containing the loaded texture
 *
 * @example
 * ```typescript
 * const texture = injectEnvironment(() => ({ preset: 'sunset' }));
 * ```
 */
export function injectEnvironment(
	options: () => Partial<NgtsEnvironmentResourceOptions> = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectEnvironment, injector, () => {
		const resource = environmentResource(options, { injector });
		return resource.texture;
	});
}

/**
 * Preloads an environment texture.
 * @deprecated Use `environmentResource.preload` instead. Will be removed in v5.0.0.
 */
injectEnvironment.preload = (options: () => Partial<NgtsEnvironmentResourceOptions> = () => ({})) => {
	environmentResource.preload(options());
};

/**
 * Clears a preloaded environment texture from cache.
 * @deprecated Use `environmentResource.clear` instead. Will be removed in v5.0.0.
 */
injectEnvironment.clear = (clearOptions: { files?: string | string[]; preset?: NgtsEnvironmentPresets }) => {
	environmentResource.clear(clearOptions);
};
