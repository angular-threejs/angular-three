import { ChangeDetectorRef, inject } from '@angular/core';
import {
    ReplaySubject,
    catchError,
    forkJoin,
    from,
    isObservable,
    map,
    of,
    retry,
    share,
    switchMap,
    take,
    tap,
    type Observable,
} from 'rxjs';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import type {
    NgtAnyRecord,
    NgtBranchingReturn,
    NgtLoaderExtensions,
    NgtLoaderProto,
    NgtLoaderReturnType,
    NgtObjectMap,
} from './types';
import { makeObjectGraph } from './utils/make';
import { safeDetectChanges } from './utils/safe-detect-changes';

export type NgtLoaderResults<
    TInput extends string | string[] | Record<string, string>,
    TReturn
> = TInput extends string[] ? TReturn[] : TInput extends object ? { [key in keyof TInput]: TReturn } : TReturn;

const cached = new Map<string, Observable<any>>();

function load<
    TData,
    TUrl extends string | string[] | Record<string, string>,
    TLoaderConstructor extends NgtLoaderProto<TData>
>(
    loaderConstructorFactory: (inputs: TUrl) => TLoaderConstructor,
    input: TUrl | Observable<TUrl>,
    extensions?: NgtLoaderExtensions<TLoaderConstructor>,
    onProgress?: (event: ProgressEvent) => void
) {
    const urls$ = isObservable(input) ? input : of(input);
    return urls$.pipe(
        map((inputs) => {
            const loaderConstructor = loaderConstructorFactory(inputs);
            const loader = new loaderConstructor();
            if (extensions) extensions(loader);
            const urls = Array.isArray(inputs) ? inputs : typeof inputs === 'string' ? [inputs] : Object.values(inputs);
            return [
                urls.map((url) => {
                    if (!cached.has(url)) {
                        cached.set(
                            url,
                            from(loader.loadAsync(url, onProgress)).pipe(
                                tap((data) => {
                                    if ((data as NgtAnyRecord)['scene'])
                                        Object.assign(
                                            data as NgtAnyRecord,
                                            makeObjectGraph((data as NgtAnyRecord)['scene'])
                                        );
                                }),
                                retry(2),
                                catchError((err) => {
                                    console.error(`[NGT] Error loading ${url}: ${err.message}`);
                                    return of([]);
                                }),
                                share({ connector: () => new ReplaySubject(1) })
                            )
                        );
                    }
                    return cached.get(url);
                }),
                inputs,
            ] as [Array<Observable<any>>, TUrl | TUrl[]];
        })
    );
}

export function injectNgtLoader<
    TData,
    TUrl extends string | string[] | Record<string, string>,
    TLoaderConstructor extends NgtLoaderProto<TData>,
    TReturn = NgtLoaderReturnType<TData, TLoaderConstructor>
>(
    loaderConstructorFactory: (inputs: TUrl) => TLoaderConstructor,
    input: TUrl | Observable<TUrl>,
    extensions?: NgtLoaderExtensions<TLoaderConstructor>,
    onProgress?: (event: ProgressEvent) => void
): Observable<NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, GLTF, GLTF & NgtObjectMap>>> {
    const cdr = inject(ChangeDetectorRef);

    return load(loaderConstructorFactory, input, extensions, onProgress).pipe(
        switchMap(([observables$, inputs]) => {
            return forkJoin(observables$).pipe(
                map((results) => {
                    if (Array.isArray(inputs)) return results;
                    if (typeof inputs === 'string') return results[0];
                    const keys = Object.keys(inputs);
                    return keys.reduce((result, key) => {
                        result[key as keyof typeof result] = results[keys.indexOf(key)];
                        return result;
                    }, {} as { [key in keyof TUrl]: NgtBranchingReturn<TReturn, GLTF, GLTF & NgtObjectMap> });
                }),
                tap(() => {
                    requestAnimationFrame(() => void safeDetectChanges(cdr));
                })
            );
        })
    );
}

injectNgtLoader['destroy'] = () => {
    cached.clear();
};

injectNgtLoader['preLoad'] = <
    TData,
    TUrl extends string | string[] | Record<string, string>,
    TLoaderConstructor extends NgtLoaderProto<TData>
>(
    loaderConstructorFactory: (inputs: TUrl) => TLoaderConstructor,
    inputs: TUrl | Observable<TUrl>,
    extensions?: NgtLoaderExtensions<TLoaderConstructor>
) => {
    load(loaderConstructorFactory, inputs, extensions).pipe(take(1)).subscribe();
};
