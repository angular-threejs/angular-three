import { EnvironmentInjector, inject, Injector } from '@angular/core';

export function createRunInContext() {
    const nodeInjector = inject(Injector);
    const envInjector = inject(EnvironmentInjector);

    const originalGet = envInjector.get;

    return <TReturn>(cb: () => TReturn): TReturn => {
        envInjector.get = (...args: Parameters<EnvironmentInjector['get']>) => {
            try {
                const fromNodeInjector = nodeInjector.get(...(args as Parameters<Injector['get']>));
                if (fromNodeInjector) return fromNodeInjector;
                return originalGet(...args);
            } catch (e) {
                return originalGet(...args);
            }
        };

        return envInjector.runInContext(cb);
    };
}
