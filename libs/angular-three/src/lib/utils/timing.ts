import { Injector, runInInjectionContext } from '@angular/core';
import { assertInjectionContext } from './assert-in-injection-context';

export function requestAnimationFrameInInjectionContext(cb: () => void, injector?: Injector) {
    injector = assertInjectionContext(requestAnimationFrameInInjectionContext, injector);
    return requestAnimationFrame(() => {
        return runInInjectionContext(injector!, cb);
    });
}
