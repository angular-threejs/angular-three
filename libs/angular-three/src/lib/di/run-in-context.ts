import { EnvironmentInjector, inject, Injector } from '@angular/core';

export function createRunInContext() {
    const nodeInjector = inject(Injector);
    const envInjector = inject(EnvironmentInjector);

    const originalGet = envInjector.get.bind(envInjector);

    return <TReturn>(cb: () => TReturn): TReturn => {
        let tryFromNodeInjector = false;
        envInjector.get = (...args: Parameters<EnvironmentInjector['get']>) => {
            try {
                const fromEnvInjector = originalGet(...args);
                if (fromEnvInjector) return fromEnvInjector;
                if (fromEnvInjector === null && args[1] !== undefined && args[1] === null) return fromEnvInjector;
                if (!tryFromNodeInjector) {
                    tryFromNodeInjector = true;
                    const fromNodeInjector = nodeInjector.get(...(args as Parameters<Injector['get']>));
                    tryFromNodeInjector = false;
                    return fromNodeInjector;
                }
                return null;
            } catch (e) {
                return originalGet(...args);
            }
        };

        return envInjector.runInContext(cb);
    };
}
