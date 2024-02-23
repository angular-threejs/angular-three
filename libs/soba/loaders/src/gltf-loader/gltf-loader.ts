import type { Injector, Signal } from '@angular/core';
import { injectNgtLoader, type NgtLoaderResults, type NgtObjectMap } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { DRACOLoader, GLTFLoader, MeshoptDecoder, type GLTF } from 'three-stdlib';

let dracoLoader: DRACOLoader | null = null;
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

function _extensions(useDraco: boolean | string, useMeshOpt: boolean, extensions?: (loader: GLTFLoader) => void) {
	return (loader: THREE.Loader) => {
		if (extensions) {
			extensions(loader as GLTFLoader);
		}

		if (useDraco) {
			if (!dracoLoader) {
				dracoLoader = new DRACOLoader();
			}

			dracoLoader.setDecoderPath(typeof useDraco === 'string' ? useDraco : decoderPath);
			(loader as GLTFLoader).setDRACOLoader(dracoLoader);
		}
		if (useMeshOpt) {
			(loader as GLTFLoader).setMeshoptDecoder(
				typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder,
			);
		}
	};
}

export type NgtsGLTF<T extends Partial<NgtObjectMap>> = GLTF & NgtObjectMap & T;

function _injectNgtsGLTFLoader<TUrl extends string | string[] | Record<string, string>>(
	path: () => TUrl,
	{
		useDraco = true,
		useMeshOpt = true,
		injector,
		extensions,
	}: {
		useDraco?: boolean | string;
		useMeshOpt?: boolean;
		injector?: Injector;
		extensions?: (loader: GLTFLoader) => void;
	} = {},
): Signal<NgtLoaderResults<TUrl, GLTF & NgtObjectMap> | null> {
	return assertInjector(_injectNgtsGLTFLoader, injector, () =>
		injectNgtLoader(() => GLTFLoader, path, {
			// TODO: fix "as any" when three-stdlib is updated with THREE 0.156
			extensions: _extensions(useDraco, useMeshOpt, extensions),
		}),
	) as Signal<NgtLoaderResults<TUrl, GLTF & NgtObjectMap> | null>;
}

_injectNgtsGLTFLoader.preload = <TUrl extends string | string[] | Record<string, string>>(
	path: () => TUrl,
	{
		useDraco = true,
		useMeshOpt = true,
		extensions,
	}: {
		useDraco?: boolean | string;
		useMeshOpt?: boolean;
		extensions?: (loader: GLTFLoader) => void;
	} = {},
) => {
	injectNgtLoader.preload(() => GLTFLoader, path, _extensions(useDraco, useMeshOpt, extensions) as any);
};

_injectNgtsGLTFLoader.setDecoderPath = (path: string) => {
	decoderPath = path;
};

export type NgtsGLTFLoader = typeof _injectNgtsGLTFLoader;
export const injectNgtsGLTFLoader: NgtsGLTFLoader = _injectNgtsGLTFLoader;
