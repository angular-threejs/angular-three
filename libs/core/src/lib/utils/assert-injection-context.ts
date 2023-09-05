import { Injector, assertInInjectionContext, inject } from '@angular/core';

export function assertInjectionContext(fn: Function, injector?: Injector): Injector {
	!injector && assertInInjectionContext(fn);
	return injector ?? inject(Injector);
}
