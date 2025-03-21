import { Injector } from '@angular/core';
import { loaderResource } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { FBXLoader } from 'three-stdlib';

export function fbxResource<TUrl extends string | string[] | Record<string, string>>(
	input: () => TUrl,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(fbxResource, injector, () => {
		return loaderResource(() => FBXLoader, input);
	});
}

fbxResource.preload = <TUrl extends string | string[] | Record<string, string>>(input: TUrl) => {
	loaderResource.preload(FBXLoader, input);
};
