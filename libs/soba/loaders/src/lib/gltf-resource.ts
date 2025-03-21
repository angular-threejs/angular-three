import { computed, Injector, ResourceRef, Signal } from '@angular/core';
import { loaderResource, type NgtObjectMap } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { DRACOLoader, type GLTF, GLTFLoader, MeshoptDecoder } from 'three-stdlib';

let dracoLoader: DRACOLoader | null = null;
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

type GLTFUrl<TGLTF extends GLTF | GLTF[] | Record<string, GLTF>> = TGLTF extends GLTF
	? string
	: TGLTF extends GLTF[]
		? string[]
		: TGLTF extends Record<string, GLTF>
			? Record<string, string>
			: never;
type GLTFObjectMap<
	TGLTF extends GLTF | GLTF[] | Record<string, GLTF>,
	TUrl extends string | string[] | Record<string, string>,
> = [TGLTF, TUrl] extends [GLTF, string]
	? TGLTF & NgtObjectMap
	: [TGLTF, TUrl] extends [Array<infer _GLTF extends GLTF>, string[]]
		? Array<_GLTF & NgtObjectMap>
		: [TGLTF, TUrl] extends [Record<string, infer _GLTF extends GLTF>, Record<string, string>]
			? { [Key in keyof TGLTF]: _GLTF & NgtObjectMap }
			: [TGLTF, TUrl] extends [GLTF, string[] | Record<string, string>]
				? TUrl extends string[]
					? Array<TGLTF & NgtObjectMap>
					: { [K in keyof TUrl]: TGLTF & NgtObjectMap }
				: never;
type GLTFObjectSceneMap<
	TGLTF extends GLTF | GLTF[] | Record<string, GLTF>,
	TUrl extends string | string[] | Record<string, string>,
> = [TGLTF, TUrl] extends [GLTF, string]
	? GLTF['scene']
	: [TGLTF, TUrl] extends [Array<infer _GLTF extends GLTF>, string[]]
		? Array<_GLTF['scene']>
		: [TGLTF, TUrl] extends [Record<string, infer _GLTF extends GLTF>, Record<string, string>]
			? { [Key in keyof TGLTF]: _GLTF['scene'] }
			: [TGLTF, TUrl] extends [GLTF, string[] | Record<string, string>]
				? TUrl extends string[]
					? Array<GLTF['scene']>
					: { [K in keyof TUrl]: GLTF['scene'] }
				: never;

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

export function gltfResource<
	TGLTF extends GLTF | GLTF[] | Record<string, GLTF> = GLTF,
	TUrl extends string | string[] | Record<string, string> = GLTFUrl<TGLTF>,
>(
	input: () => TUrl,
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
		onLoad?: (data: GLTFObjectMap<TGLTF, TUrl>) => void;
	} = {},
) {
	return assertInjector(gltfResource, injector, () => {
		const resource = loaderResource(() => GLTFLoader, input, {
			extensions: _extensions(useDraco, useMeshOpt, extensions),
			// @ts-expect-error - we know the type of the data
			onLoad,
		}) as ResourceRef<GLTFObjectMap<TGLTF, TUrl> | undefined> & {
			scene: Signal<GLTFObjectSceneMap<TGLTF, TUrl> | null>;
		};

		Object.defineProperty(resource, 'scene', {
			value: computed(() => {
				const data = resource.value();
				if (!data) return null;
				if (Array.isArray(data)) {
					return data.map((item) => item.scene);
				}
				if ('parser' in data) {
					return data.scene;
				}
				return Object.keys(data).reduce(
					(acc, key) => {
						acc[key] = data[key as keyof typeof data].scene;
						return acc;
					},
					{} as Record<string, THREE.Group>,
				);
			}),
		});

		return resource;
	});
}

gltfResource.preload = <TUrl extends string | string[] | Record<string, string>>(
	input: TUrl,
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
	loaderResource.preload(GLTFLoader, input, _extensions(useDraco, useMeshOpt, extensions));
};

gltfResource.setDecoderPath = (path: string) => {
	decoderPath = path;
};
