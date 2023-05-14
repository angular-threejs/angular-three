import { Injector, runInInjectionContext } from '@angular/core';
import { assertInjectionContext } from './assert-in-injection-context';

export function requestAnimationInInjectionContext(cb: () => void, injector?: Injector) {
    injector = assertInjectionContext(requestAnimationInInjectionContext, injector);
    return requestAnimationFrame(() => {
        return runInInjectionContext(injector!, cb);
    });
}

export function queueMicrotaskInInjectionContext(cb: () => void, injector?: Injector) {
    injector = assertInjectionContext(requestAnimationInInjectionContext, injector);
    return queueMicrotask(() => {
        return runInInjectionContext(injector!, cb);
    });
}

export function queueMacrotaskInInjectionContext(cb: () => void, injector?: Injector) {
    injector = assertInjectionContext(requestAnimationInInjectionContext, injector);
    return setTimeout(() => {
        return runInInjectionContext(injector!, cb);
    });
}
