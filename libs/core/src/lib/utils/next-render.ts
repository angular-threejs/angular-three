import { AfterRenderPhase, Injector, afterNextRender, inject } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';

export function injectAutoAfterNextRender(injector?: Injector) {
	return assertInjector(injectAutoAfterNextRender, injector, () => {
		const assertedInjector = inject(Injector);
		return (cb: (theInjector: Injector) => void, phase?: AfterRenderPhase) =>
			afterNextRender(() => void cb(assertedInjector), { injector: assertedInjector, phase });
	});
}
