import { Injector } from '@angular/core';
import { injectLoader } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { FBXLoader } from 'three-stdlib';

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
export const injectFBX: NgtsFBXLoader = _injectFBX;
