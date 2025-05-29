import { Injector, Signal, effect, signal } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import type { NgtAnyRecord } from './types';
import { NgtObjectMap, makeObjectGraph } from './utils/make';

export type NgtGLTFLike = { scene: THREE.Object3D };

export interface NgtLoader<T> extends THREE.Loader {
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
const memoizedLoaders = new WeakMap();

function normalizeInputs(input: string | string[] | Record<string, string>) {
	let urls: string[] = [];
	if (Array.isArray(input)) {
		urls = input;
	} else if (typeof input === 'string') {
		urls = [input];
	} else {
		urls = Object.values(input);
	}

	return urls.map((url) => (url.includes('undefined') || url.includes('null') || !url ? '' : url));
}

function load<
	TData,
	TUrl extends string | string[] | Record<string, string>,
	TLoaderConstructor extends NgtLoaderProto<TData>,
	TReturn = NgtLoaderReturnType<TData, TLoaderConstructor>,
>(
	loaderConstructorFactory: (inputs: string[]) => TLoaderConstructor,
	inputs: () => TUrl,
	{
		extensions,
		onLoad,
		onProgress,
	}: {
		extensions?: NgtLoaderExtensions<TLoaderConstructor>;
		onLoad?: (data: NoInfer<TReturn>) => void;
		onProgress?: (event: ProgressEvent) => void;
	} = {},
) {
	return (): Array<Promise<any>> => {
		const urls = normalizeInputs(inputs());

		let loader: THREE.Loader<TData> = memoizedLoaders.get(loaderConstructorFactory(urls));
		if (!loader) {
			loader = new (loaderConstructorFactory(urls))();
			memoizedLoaders.set(loaderConstructorFactory(urls), loader);
		}

		if (extensions) extensions(loader);

		return urls.map((url) => {
			if (url === '') return Promise.resolve(null);

			if (!cached.has(url)) {
				cached.set(
					url,
					new Promise<TData>((resolve, reject) => {
						loader.load(
							url,
							(data) => {
								if ('scene' in (data as NgtAnyRecord)) {
									Object.assign(
										data as NgtAnyRecord,
										makeObjectGraph((data as NgtAnyRecord)['scene']),
									);
								}

								if (onLoad) {
									onLoad(data as unknown as TReturn);
								}

								resolve(data);
							},
							onProgress,
							(error) =>
								reject(new Error(`[NGT] Could not load ${url}: ${(error as ErrorEvent)?.message}`)),
						);
					}),
				);
			}

			return cached.get(url)!;
		});
	};
}

/**
 * @deprecated Use loaderResource instead. Will be removed in v5.0.0
 * @since v4.0.0~
 */
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
		onLoad,
		injector,
	}: {
		extensions?: NgtLoaderExtensions<TLoaderConstructor>;
		onProgress?: (event: ProgressEvent) => void;
		onLoad?: (data: NoInfer<TReturn>) => void;
		injector?: Injector;
	} = {},
): Signal<NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>> | null> {
	return assertInjector(_injectLoader, injector, () => {
		const response = signal<NgtLoaderResults<
			TUrl,
			NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
		> | null>(null);

		let previousNormalizedUrls: string[] | null = null;

		const cachedResultPromisesEffect = load(loaderConstructorFactory, inputs, {
			extensions,
			onProgress,
			onLoad: onLoad as (data: unknown) => void,
		});

		effect(() => {
			const currentOriginalInputs = inputs();
			const currentNormalizedUrls = normalizeInputs(currentOriginalInputs);

			if (
				previousNormalizedUrls &&
				previousNormalizedUrls.length === currentNormalizedUrls.length &&
				previousNormalizedUrls.every((url, i) => url === currentNormalizedUrls[i])
			) {
				// Normalized URLs are the same as the previous run, skip processing.
				return;
			}

			// URLs are different or it's the first run, proceed with loading.
			previousNormalizedUrls = currentNormalizedUrls;

			const cachedResultPromises = cachedResultPromisesEffect(); // This will use inputs() and re-normalize internally.
			Promise.all(cachedResultPromises).then((results) => {
				// originalUrls is used here to determine the structure of the response.
				// We use currentOriginalInputs which triggered this effect execution.
				response.update(() => {
					if (Array.isArray(currentOriginalInputs)) return results;
					if (typeof currentOriginalInputs === 'string') return results[0];
					const keys = Object.keys(currentOriginalInputs);
					return keys.reduce(
						(acc, key, index) => {
							(acc as NgtAnyRecord)[key] = results[index];
							return acc;
						},
						{} as {
							[key in keyof TUrl]: NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>;
						},
					);
				});
			});
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
	onLoad?: (data: NoInfer<TData>) => void,
) => {
	const effects = load(loaderConstructorFactory, inputs, { extensions, onLoad })();
	if (effects) {
		void Promise.all(effects);
	}
};

_injectLoader.destroy = () => {
	cached.clear();
};

_injectLoader.clear = (urls: string | string[]) => {
	const urlToClear = Array.isArray(urls) ? urls : [urls];
	urlToClear.forEach((url) => {
		cached.delete(url);
	});
};

export type NgtInjectedLoader = typeof _injectLoader;

/**
 * @deprecated Use loaderResource instead. Will be removed in v5.0.0
 * @since v4.0.0~
 */
export const injectLoader: NgtInjectedLoader = _injectLoader;
