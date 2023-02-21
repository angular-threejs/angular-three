import { EnvironmentInjector, inject, Injector } from '@angular/core';

export function createRunInContext() {
    const nodeInjector = inject(Injector);
    const envInjector = inject(EnvironmentInjector);

    const originalGet = envInjector.get.bind(envInjector);

    return <TReturn>(cb: () => TReturn): TReturn => {
        let tryFromNodeInjector = false;
        envInjector.get = (...args: Parameters<EnvironmentInjector['get']>) => {
            try {
                if (!tryFromNodeInjector) {
                    tryFromNodeInjector = true;
                    const fromNodeInjector = nodeInjector.get(...(args as Parameters<Injector['get']>));
                    if (fromNodeInjector) {
                        tryFromNodeInjector = false;
                        return fromNodeInjector;
                    }
                }
                return originalGet(...args);
            } catch (e) {
                return originalGet(...args);
            } finally {
                tryFromNodeInjector = false;
            }
        };

        return envInjector.runInContext(cb);
    };
}
