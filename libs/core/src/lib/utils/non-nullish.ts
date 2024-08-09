import { Injector, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { assertInjector } from 'ngxtension/assert-injector';
import { map } from 'rxjs';

export function injectNonNullish$(sig: Signal<unknown>, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectNonNullish$, injector, () => toObservable(sig).pipe(map((val) => val != null)));
}
