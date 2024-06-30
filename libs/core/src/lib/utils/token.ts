import { InjectionToken, Provider, Type, forwardRef, inject } from '@angular/core';
import { CreateInjectionTokenReturn } from 'ngxtension/create-injection-token';

export function createInjectFn<
	TToken extends InjectionToken<any>,
	TValue = TToken extends InjectionToken<infer Value> ? Value : never,
>(token: TToken): CreateInjectionTokenReturn<TValue>[0] {
	return ((options) => inject(token, options)) as CreateInjectionTokenReturn<TValue>[0];
}

export function createApiToken<TObject extends { api: any }, TApi = TObject extends { api: infer Api } ? Api : never>(
	forwarded: () => Type<TObject>,
) {
	const apiToken = new InjectionToken<TApi>('API for ' + forwarded().name);
	const injectFn = createInjectFn(apiToken);

	const provideFn = () =>
		({
			provide: apiToken,
			useFactory: (obj: TObject) => obj.api,
			deps: [forwardRef(forwarded)],
		}) as Provider;

	return [injectFn, provideFn] as const;
}
