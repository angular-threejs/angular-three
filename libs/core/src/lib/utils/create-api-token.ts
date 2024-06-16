import { forwardRef, Type } from '@angular/core';
import { createInjectionToken, CreateInjectionTokenOptions } from 'ngxtension/create-injection-token';

function apiFactory<TObject extends { api: any }, TApi = TObject extends { api: infer Api } ? Api : never>(
	obj: TObject,
): TApi {
	return obj.api;
}

export function createApiToken<TObject extends { api: any }, TApi = TObject extends { api: infer Api } ? Api : never>(
	forwardedObject: () => Type<TObject>,
) {
	const [injectFn, provideFn] = createInjectionToken(apiFactory<TObject, TApi>, {
		isRoot: false,
		deps: [forwardRef(forwardedObject)],
	} as unknown as CreateInjectionTokenOptions<typeof apiFactory, [TObject]>);

	return [injectFn, () => provideFn()] as const;
}
