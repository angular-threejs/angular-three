import { Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import {
	environmentResource,
	type NgtsEnvironmentPresets,
	type NgtsEnvironmentResourceOptions,
} from './environment-resource';

/**
 * @deprecated use environmentResource instead. Will be removed in v5.0.0
 * @since v4.0.0
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

injectEnvironment.preload = (options: () => Partial<NgtsEnvironmentResourceOptions> = () => ({})) => {
	environmentResource.preload(options());
};

injectEnvironment.clear = (clearOptions: { files?: string | string[]; preset?: NgtsEnvironmentPresets }) => {
	environmentResource.clear(clearOptions);
};
