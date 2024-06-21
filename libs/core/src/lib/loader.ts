import { Injector, Signal, effect, signal } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import { Loader, Object3D } from 'three';
import { NgtAnyRecord } from './types';
import { NgtObjectMap, makeObjectGraph } from './utils/make';

export type NgtGLTFLike = { scene: Object3D };

export interface NgtLoader<T> extends Loader {
	load(
		url: string,
		onLoad?: (result: T) => void,
		onProgress?: (event: ProgressEvent) => void,
		onError?: (event: unknown) => void,
	): unknown;
	loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<T>;
}

export type NgtLoaderProto<T> = new (...args: any) => NgtLoader<T extends unknown ? any : T>;
export type NgtLoaderReturnType<T, L extends NgtLoaderProto<T>> = T extends unknown
	? Awaited<ReturnType<InstanceType<L>['loadAsync']>>
	: T;

export type NgtLoaderExtensions<T extends { prototype: NgtLoaderProto<any> }> = (loader: T['prototype']) => void;
export type NgtConditionalType<Child, Parent, Truthy, Falsy> = Child extends Parent ? Truthy : Falsy;
export type NgtBranchingReturn<T, Parent, Coerced> = NgtConditionalType<T, Parent, Coerced, T>;

export type NgtLoaderResults<
	TInput extends string | string[] | Record<string, string>,
	TReturn,
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
	TLoaderConstructor extends NgtLoaderProto<TData>,
>(
	loaderConstructorFactory: (inputs: string[]) => TLoaderConstructor,
	inputs: () => TUrl,
	{
		extensions,
		onProgress,
	}: { extensions?: NgtLoaderExtensions<TLoaderConstructor>; onProgress?: (event: ProgressEvent) => void } = {},
) {
	return (): Array<Promise<any>> | null => {
		const urls = normalizeInputs(inputs());

		if (urls.some((url) => url.includes('undefined'))) return null;

		const loader = new (loaderConstructorFactory(urls))();
		if (extensions) extensions(loader);
		// TODO: reevaluate this
		return urls.map((url) => {
			if (!cached.has(url)) {
				cached.set(
					url,
					new Promise<TData>((resolve, reject) => {
						loader.load(
							url,
							(data) => {
								if ('scene' in (data as NgtAnyRecord)) {
									Object.assign(data as NgtAnyRecord, makeObjectGraph((data as NgtAnyRecord)['scene']));
								}
								resolve(data);
							},
							onProgress,
							(error) => reject(new Error(`[NGT] Could not load ${url}: ${error}`)),
						);
					}),
				);
			}
			return cached.get(url)!;
		});
	};
}

function _injectLoader<
	TData,
	TUrl extends string | string[] | Record<string, string>,
	TLoaderConstructor extends NgtLoaderProto<TData>,
	TReturn = NgtLoaderReturnType<TData, TLoaderConstructor>,
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
	} = {},
): Signal<NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>> | null> {
	return assertInjector(_injectLoader, injector, () => {
		const response = signal<NgtLoaderResults<
			TUrl,
			NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
		> | null>(null);
		const effector = load(loaderConstructorFactory, inputs, { extensions, onProgress });

		effect(() => {
			const originalUrls = inputs();
			const cachedEffect = effector();
			if (cachedEffect === null) {
				response.set(null);
			} else {
				Promise.all(cachedEffect).then((results) => {
					response.update(() => {
						if (Array.isArray(originalUrls)) return results;
						if (typeof originalUrls === 'string') return results[0];
						const keys = Object.keys(originalUrls);
						return keys.reduce(
							(result, key) => {
								(result as NgtAnyRecord)[key] = results[keys.indexOf(key)];
								return result;
							},
							{} as { [key in keyof TUrl]: NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap> },
						);
					});
				});
			}
		});

		return response.asReadonly();
	});
}

_injectLoader.preload = <
	TData,
	TUrl extends string | string[] | Record<string, string>,
	TLoaderConstructor extends NgtLoaderProto<TData>,
>(
	loaderConstructorFactory: (inputs: string[]) => TLoaderConstructor,
	inputs: () => TUrl,
	extensions?: NgtLoaderExtensions<TLoaderConstructor>,
) => {
	const effects = load(loaderConstructorFactory, inputs, { extensions })();
	if (effects) {
		void Promise.all(effects);
	}
};

_injectLoader.destroy = () => {
	cached.clear();
};

export type NgtInjectedLoader = typeof _injectLoader;
export const injectLoader: NgtInjectedLoader = _injectLoader;
