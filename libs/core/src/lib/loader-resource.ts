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

function getLoaderRequestParams<
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
	request: { loader: THREE.Loader<TData>; normalizedUrls: string[]; urls: TUrl },
	onProgress?: { (event: ProgressEvent<EventTarget>): void },
) {
	return request.normalizedUrls.map((url) => {
		if (url === '') return Promise.resolve(null);
		const cachedPromise = cached.get(url);
		if (cachedPromise) return cachedPromise;

		const promise = new Promise<TData>((res, rej) => {
			request.loader.load(
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
			request: () => getLoaderRequestParams(input, loaderConstructorFactory, extensions),
			loader: async ({ request }) => {
				// TODO: use the abortSignal when THREE.Loader supports it

				const loadedResults = await Promise.all(getLoaderPromises(request, onProgress));

				let results: NgtLoaderResults<
					TUrl,
					NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
				>;

				if (Array.isArray(request.urls)) {
					results = loadedResults as NgtLoaderResults<
						TUrl,
						NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
					>;
				} else if (typeof request.urls === 'string') {
					results = loadedResults[0] as NgtLoaderResults<
						TUrl,
						NgtBranchingReturn<TReturn, NgtGLTFLike, NgtGLTFLike & NgtObjectMap>
					>;
				} else {
					const keys = Object.keys(request.urls);
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
	const params = getLoaderRequestParams(
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
