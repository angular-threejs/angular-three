import { InjectionToken, Type, forwardRef, inject } from '@angular/core';
import { CreateInjectionTokenReturn } from 'ngxtension/create-injection-token';
import { NgtSignalStore } from './signal-store';

export function createInjectFn<
	TToken extends InjectionToken<any>,
	TValue = TToken extends InjectionToken<infer Value> ? Value : never,
>(token: TToken): CreateInjectionTokenReturn<TValue>[0] {
	return ((options) => inject(token, options)) as CreateInjectionTokenReturn<TValue>[0];
}

export function createApiToken<TObject extends object, TApiFunction extends (obj: TObject) => NgtSignalStore<object>>(
	tokenDescription: string,
	forwarded: () => Type<TObject>,
	apiFactory: TApiFunction,
) {
	type TApi = ReturnType<TApiFunction>;

	const apiToken = new InjectionToken<TApi>('API for ' + tokenDescription);
	const injectFn = createInjectFn(apiToken);

	const provideFn = () => ({
		provide: apiToken,
		useFactory: apiFactory,
		deps: [forwardRef(forwarded)],
	});

	return [injectFn, provideFn] as const;
}
