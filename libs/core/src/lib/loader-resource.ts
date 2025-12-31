import { type Injector, resource, type ResourceRef } from '@angular/core';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import type {
	NgtBranchingReturn,
	NgtGLTFLike,
	NgtLoaderExtensions,
	NgtLoaderProto,
	NgtLoaderResults,
	NgtLoaderReturnType,
} from './loader';
import type { NgtAnyRecord } from './types';
import { makeObjectGraph, type NgtObjectMap } from './utils/make';

/**
 * @fileoverview Asset loading utilities using Angular's resource API.
 *
 * This module provides the `loaderResource` function for loading Three.js assets
 * using Angular's resource API, which provides better integration with Angular's
 * change detection and signal-based reactivity.
 */

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

const cached = new Map();
const memoizedLoaders = new WeakMap();

function getLoaderResourceParams<
	TData,
	TUrl extends string | string[] | Record<string, string>,
	TLoaderConstructor extends NgtLoaderProto<TData>,
>(
	input: { (): TUrl },
	loaderConstructorFactory: {
		(url: TUrl): TLoaderConstructor;
	},
	extensions: NgtLoaderExtensions<TLoaderConstructor> | undefined,
) {
	const urls = input();
	const LoaderConstructor = loaderConstructorFactory(urls);
	const normalizedUrls = normalizeInputs(urls);
	let loader: THREE.Loader<TData> = memoizedLoaders.get(LoaderConstructor);
	if (!loader) {
		loader = new LoaderConstructor();
		memoizedLoaders.set(LoaderConstructor, loader);
	}

	if (extensions) extensions(loader);

	return { urls, normalizedUrls, loader };
}

function getLoaderPromises<TData, TUrl extends string | string[] | Record<string, string>>(
	params: { loader: THREE.Loader<TData>; normalizedUrls: string[]; urls: TUrl },
	onProgress?: { (event: ProgressEvent<EventTarget>): void },
) {
	return params.normalizedUrls.map((url) => {
		if (url === '') return Promise.resolve(null);
		const cachedPromise = cached.get(url);
		if (cachedPromise) return cachedPromise;

		const promise = new Promise<TData>((res, rej) => {
			params.loader.load(
				url,
				(data) => {
					if ('scene' in (data as NgtAnyRecord)) {
						Object.assign(data as NgtAnyRecord, makeObjectGraph((data as NgtAnyRecord)['scene']));
					}

					res(data);
				},
				onProgress,
				(error) => rej(new Error(`[NGT] Could not load ${url}: ${(error as ErrorEvent)?.message}`)),
			);
		});

		cached.set(url, promise);

		return promise;
	});
}

/**
 * Loads Three.js assets using Angular's resource API.
 *
 * This function provides a signal-based approach to loading Three.js assets like
 * GLTF models, textures, and other files. It leverages Angular's resource API
 * for better integration with Angular's reactivity system.
 *
 * Features:
 * - Automatic caching of loaded assets
 * - Support for single URLs, arrays, or object maps
 * - GLTF scene graph extraction
 * - Progress and completion callbacks
 *
 * @typeParam TData - The type of data returned by the loader
 * @typeParam TUrl - The type of URL input (string, string[], or Record<string, string>)
 * @typeParam TLoaderConstructor - The loader constructor type
 * @typeParam TReturn - The return type after loading
 *
 * @param loaderConstructorFactory - Factory function that returns the loader constructor
 * @param input - Signal or function returning the URL(s) to load
 * @param options - Optional configuration including extensions, callbacks, and injector
 * @returns A ResourceRef containing the loaded data
 *
 * @example
 * ```typescript
 * // Load a single GLTF model
 * const model = loaderResource(
 *   () => GLTFLoader,
 *   () => '/assets/model.gltf'
 * );
 *
 * // Access in template
 * @if (model.value(); as gltf) {
 *   <ngt-primitive *args="[gltf.scene]" />
 * }
 * ```
 */
export function loaderResource<
	TData,
	TUrl extends string | string[] | Record<string, string>,
	TLoaderConstructor extends NgtLoaderProto<TData>,
	TReturn = NgtLoaderReturnType<TData, TLoaderConstructor>,
>(
	loaderConstructorFactory: (url: TUrl) => TLoaderConstructor,
	input: () => TUrl,
	{
		extensions,
		onLoad,
		onProgress,
		injector,
	}: {
		extensions?: NgtLoaderExtensions<TLoaderConstructor>;
		onLoad?: (
			data: NoInfer<NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>>>,
		) => void;
		onProgress?: (event: ProgressEvent) => void;
		injector?: Injector;
	} = {},
): ResourceRef<
	NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>> | undefined
> {
	return assertInjector(loaderResource, injector, () => {
		return resource({
			params: () => getLoaderResourceParams(input, loaderConstructorFactory, extensions),
			loader: async ({ params }) => {
				// TODO: use the abortSignal when THREE.Loader supports it

				const loadedResults = await Promise.all(getLoaderPromises(params, onProgress));

				let results: NgtLoaderResults<
					TUrl,
					NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
				>;

				if (Array.isArray(params.urls)) {
					results = loadedResults as NgtLoaderResults<
						TUrl,
						NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
					>;
				} else if (typeof params.urls === 'string') {
					results = loadedResults[0] as NgtLoaderResults<
						TUrl,
						NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
					>;
				} else {
					const keys = Object.keys(params.urls);
					results = keys.reduce(
						(result, key) => {
							// @ts-ignore
							(result as NgtAnyRecord)[key] = loadedResults[keys.indexOf(key)];
							return result;
						},
						{} as {
							[key in keyof TUrl]: NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>;
						},
					) as NgtLoaderResults<TUrl, NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>>;
				}

				if (onLoad) onLoad(results);

				return results;
			},
		});
	});
}

loaderResource.preload = <
	TData,
	TUrl extends string | string[] | Record<string, string>,
	TLoaderConstructor extends NgtLoaderProto<TData>,
>(
	loaderConstructor: TLoaderConstructor,
	inputs: TUrl,
	extensions?: NgtLoaderExtensions<TLoaderConstructor>,
) => {
	const params = getLoaderResourceParams(
		() => inputs,
		() => loaderConstructor,
		extensions,
	);
	void Promise.all(getLoaderPromises(params));
};

loaderResource.destroy = () => {
	cached.clear();
};

loaderResource.clear = (urls: string | string[]) => {
	const urlToClear = Array.isArray(urls) ? urls : [urls];
	urlToClear.forEach((url) => {
		cached.delete(url);
	});
};
