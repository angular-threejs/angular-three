import { ChangeDetectorRef, Injector, effect, inject, runInInjectionContext, signal, type Signal } from '@angular/core';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import type {
    NgtAnyRecord,
    NgtBranchingReturn,
    NgtLoaderExtensions,
    NgtLoaderProto,
    NgtLoaderReturnType,
    NgtObjectMap,
} from './types';
import { assertInjectionContext } from './utils/assert-in-injection-context';
import { makeObjectGraph } from './utils/make';
import { safeDetectChanges } from './utils/safe-detect-changes';
import { requestAnimationFrameInInjectionContext } from './utils/timing';

export type NgtLoaderResults<
    TInput extends string | string[] | Record<string, string>,
    TReturn
> = TInput extends string[] ? TReturn[] : TInput extends object ? { [key in keyof TInput]: TReturn } : TReturn;

const cached = new Map();

function normalizeInputs(input: string | string[] | Record<string, string>) {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return [input];
    return Object.values(input);
}

function load<
    TData,
    TUrl extends string | string[] | Record<string, string>,
    TLoaderConstructor extends NgtLoaderProto<TData>
>(
    loaderConstructorFactory: (inputs: string[]) => TLoaderConstructor,
    inputs: () => TUrl,
    {
        extensions,
        onProgress,
    }: {
        extensions?: NgtLoaderExtensions<TLoaderConstructor>;
        onProgress?: (event: ProgressEvent) => void;
    } = {}
) {
    return () => {
        const urls = normalizeInputs(inputs());
        const loader = new (loaderConstructorFactory(urls))();
        if (extensions) extensions(loader);
        // TODO: reevaluate this
        return urls.map((url) => {
            if (!cached.has(url)) {
                cached.set(
                    url,
                    new Promise((resolve, reject) => {
                        loader.load(
                            url,
                            (data) => {
                                if ('scene' in (data as NgtAnyRecord))
                                    Object.assign(
                                        data as NgtAnyRecord,
                                        makeObjectGraph((data as NgtAnyRecord)['scene'])
                                    );
                                resolve(data);
                            },
                            onProgress,
                            (error) => reject(new Error(`[NGT] Could not load ${url}: ${error}`))
                        );
                    })
                );
            }
            return cached.get(url)!;
        });
    };
}

export function injectNgtLoader<
    TData,
    TUrl extends string | string[] | Record<string, string>,
    TLoaderConstructor extends NgtLoaderProto<TData>,
    TReturn = NgtLoaderReturnType<TData, TLoaderConstructor>
>(
    loaderConstructorFactory: (inputs: string[]) => TLoaderConstructor,
    inputs: () => TUrl,
    {
        extensions,
        onProgress,
        injector,
    }: {
        extensions?: NgtLoaderExtensions<TLoaderConstructor>;
        onProgress?: (event: ProgressEvent) => void;
        injector?: Injector;
    } = {}
): Signal<NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, GLTF, GLTF & NgtObjectMap>>> {
    injector = assertInjectionContext(injectNgtLoader, injector);
    const response = signal<NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, GLTF, GLTF & NgtObjectMap>>>(null!);
    return runInInjectionContext(injector, () => {
        const cdr = inject(ChangeDetectorRef);
        const effector = load(loaderConstructorFactory, inputs, { extensions, onProgress });

        requestAnimationFrameInInjectionContext(() => {
            effect(
                () => {
                    const originalUrls = inputs();
                    Promise.all(effector()).then((results) => {
                        response.update(() => {
                            if (Array.isArray(originalUrls)) return results;
                            if (typeof originalUrls === 'string') return results[0];
                            const keys = Object.keys(originalUrls);
                            return keys.reduce((result, key) => {
                                (result as NgtAnyRecord)[key] = results[keys.indexOf(key)];
                                return result;
                            }, {} as { [key in keyof TUrl]: NgtBranchingReturn<TReturn, GLTF, GLTF & NgtObjectMap> });
                        });
                        safeDetectChanges(cdr);
                    });
                },
                { allowSignalWrites: true }
            );
        });

        return response.asReadonly();
    });
}

injectNgtLoader['preload'] = <
    TData,
    TUrl extends string | string[] | Record<string, string>,
    TLoaderConstructor extends NgtLoaderProto<TData>
>(
    loaderConstructorFactory: (inputs: string[]) => TLoaderConstructor,
    inputs: () => TUrl,
    extensions?: NgtLoaderExtensions<TLoaderConstructor>
) => {
    Promise.all(load(loaderConstructorFactory, inputs, { extensions })());
};

injectNgtLoader['destroy'] = () => {
    cached.clear();
};
