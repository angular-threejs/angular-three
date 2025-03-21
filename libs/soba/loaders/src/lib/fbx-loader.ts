import { Injector } from '@angular/core';
import { injectLoader } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { FBXLoader } from 'three-stdlib';

/**
 * @deprecated Use fbxResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
function _injectFBX<TUrl extends string | string[] | Record<string, string>>(
	input: () => TUrl,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(_injectFBX, injector, () => {
		return injectLoader(() => FBXLoader, input);
	});
}

_injectFBX.preload = <TUrl extends string | string[] | Record<string, string>>(input: () => TUrl) => {
	injectLoader.preload(() => FBXLoader, input);
};

export type NgtsFBXLoader = typeof _injectFBX;

/**
 * @deprecated Use fbxResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectFBX: NgtsFBXLoader = _injectFBX;
