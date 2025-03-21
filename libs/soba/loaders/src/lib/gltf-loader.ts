import { computed, Injector, Signal } from '@angular/core';
import { injectLoader, NgtLoaderResults, NgtObjectMap } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { DRACOLoader, GLTF, GLTFLoader, MeshoptDecoder } from 'three-stdlib';

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

type InjectGLTFUrl<TGltf extends GLTF | GLTF[] | Record<string, GLTF>> = TGltf extends GLTF
	? string
	: TGltf extends GLTF[]
		? string[]
		: TGltf extends Record<string, GLTF>
			? Record<string, string>
			: never;
type InjectGLTFObjectMap<TGltf extends GLTF | GLTF[] | Record<string, GLTF>> = TGltf extends GLTF
	? TGltf & NgtObjectMap
	: TGltf extends Array<infer _GLTF extends GLTF>
		? Array<_GLTF & NgtObjectMap>
		: TGltf extends Record<string, infer _GLTF extends GLTF>
			? Record<string, _GLTF & NgtObjectMap>
			: never;

/**
 * @deprecated Use gltfResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
function _injectGLTF<
	TGltf extends GLTF | GLTF[] | Record<string, GLTF> = GLTF,
	TUrl extends string | string[] | Record<string, string> = InjectGLTFUrl<TGltf>,
>(
	path: () => TUrl,
	{
		useDraco = true,
		useMeshOpt = true,
		injector,
		extensions,
		onLoad,
	}: {
		useDraco?: boolean | string;
		useMeshOpt?: boolean;
		injector?: Injector;
		extensions?: (loader: GLTFLoader) => void;
		onLoad?: (data: InjectGLTFObjectMap<TGltf>) => void;
	} = {},
): Signal<InjectGLTFObjectMap<TGltf> | null> & { scene: Signal<GLTF['scene'] | null> } {
	return assertInjector(_injectGLTF, injector, () => {
		const result = injectLoader(() => GLTFLoader, path, {
			extensions: _extensions(useDraco, useMeshOpt, extensions),
			// @ts-expect-error - we know the type of the data
			onLoad,
		});

		Object.defineProperty(result, 'scene', {
			value: computed(() => {
				const gltf = result() as unknown as GLTF;
				if (!gltf) return null;
				return gltf.scene;
			}),
		});

		return result;
	}) as Signal<InjectGLTFObjectMap<TGltf> | null> & { scene: Signal<GLTF['scene'] | null> };
}

_injectGLTF.preload = <TUrl extends string | string[] | Record<string, string>>(
	path: () => TUrl,
	{
		useDraco = true,
		useMeshOpt = true,
		extensions,
		onLoad,
	}: {
		useDraco?: boolean | string;
		useMeshOpt?: boolean;
		extensions?: (loader: GLTFLoader) => void;
		onLoad?: (data: NgtLoaderResults<TUrl, GLTF & NgtObjectMap>) => void;
	} = {},
) => {
	injectLoader.preload(
		() => GLTFLoader,
		path,
		_extensions(useDraco, useMeshOpt, extensions) as any,
		// @ts-expect-error - we know the type of the data
		onLoad,
	);
};

_injectGLTF.setDecoderPath = (path: string) => {
	decoderPath = path;
};

export type NgtsGLTFLoader = typeof _injectGLTF;

/**
 * @deprecated Use gltfResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectGLTF: NgtsGLTFLoader = _injectGLTF;
