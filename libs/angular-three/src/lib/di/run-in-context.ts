import { EnvironmentInjector, inject, Injector } from '@angular/core';

export function createRunInContext() {
    const nodeInjector = inject(Injector);
    const envInjector = inject(EnvironmentInjector);

    const originalGet = envInjector.get.bind(envInjector);

    return <TReturn>(cb: () => TReturn): TReturn => {
        let tryFromNodeInjector = false;
        envInjector.get = (...args: Parameters<EnvironmentInjector['get']>) => {
            try {
                const originalFlags = (args as any)[2];
                if (!(originalFlags & 8)) {
                    (args as any)[2] |= 8;
                }
                const fromEnvInjector = originalGet(...args);
                if (fromEnvInjector) return fromEnvInjector;
                if (fromEnvInjector === null && ((args[1] !== undefined && args[1] === null) || originalFlags === 0))
                    return fromEnvInjector;
                (args as any)[2] = originalFlags;
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
