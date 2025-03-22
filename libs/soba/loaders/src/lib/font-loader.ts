import { Injector } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { fontResource, type NgtsFontInput } from './font-resource';

/**
 * @deprecated Use fontResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export function injectFont(input: () => NgtsFontInput, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectFont, injector, () => {
		const resource = fontResource(input, { injector });
		return resource.value.asReadonly();
	});
}

injectFont.preload = (input: () => NgtsFontInput) => {
	fontResource.preload(input());
};
injectFont.clear = (input?: () => NgtsFontInput) => {
	fontResource.clear(input?.());
};
