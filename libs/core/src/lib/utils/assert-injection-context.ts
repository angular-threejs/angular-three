import { Injector, assertInInjectionContext, inject } from '@angular/core';

export function assertInjectionContext(fn: Function, injector?: Injector): Injector {
	try {
		if (!injector) {
			return inject(Injector);
		}
		return injector;
	} catch {
		!injector && assertInInjectionContext(fn);
		return null!;
	}
}
