import { forwardRef, type Type } from '@angular/core';
import { createInjectionToken, type CreateInjectionTokenOptions } from 'ngxtension/create-injection-token';

export function createApiToken<TObject extends { api: any }, TApi = TObject extends { api: infer Api } ? Api : never>(
	forwardedObject: () => Type<TObject>,
) {
	function apiFactory(obj: TObject): TApi {
		return obj.api;
	}

	const [injectFn, provideFn] = createInjectionToken(apiFactory, {
		isRoot: false,
		deps: [forwardRef(forwardedObject)],
	} as unknown as CreateInjectionTokenOptions<typeof apiFactory, [TObject]>);

	return [injectFn, () => provideFn()] as const;
}
