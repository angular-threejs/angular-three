import { computed, Injector, Signal } from '@angular/core';
import { injectLoader, NgtLoaderResults, NgtObjectMap } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { DRACOLoader, GLTF, GLTFLoader, MeshoptDecoder } from 'three-stdlib';

const dracoLoaders = new Map<string, DRACOLoader>();
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

function getLoaderConfiguration(
	useDraco: boolean | string,
	useMeshOpt: boolean,
	extensions?: (loader: GLTFLoader) => void,
) {
	const resolvedDracoPath = useDraco ? (typeof useDraco === 'string' ? useDraco : decoderPath) : false;

	return {
		cacheKey: [resolvedDracoPath, useMeshOpt, extensions] as const,
		extensions: (loader: THREE.Loader) => {
			if (extensions) {
				extensions(loader as GLTFLoader);
			}

			if (resolvedDracoPath) {
				let dracoLoader = dracoLoaders.get(resolvedDracoPath);
				if (!dracoLoader) {
					dracoLoader = new DRACOLoader().setDecoderPath(resolvedDracoPath);
					dracoLoaders.set(resolvedDracoPath, dracoLoader);
				}

				(loader as GLTFLoader).setDRACOLoader(dracoLoader);
			}
			if (useMeshOpt) {
				(loader as GLTFLoader).setMeshoptDecoder(
					typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder,
				);
			}
		},
	};
}

/**
 * Maps a GLTF type to its corresponding URL input type.
 */
type InjectGLTFUrl<TGltf extends GLTF | GLTF[] | Record<string, GLTF>> = TGltf extends GLTF
	? string
	: TGltf extends GLTF[]
		? string[]
		: TGltf extends Record<string, GLTF>
			? Record<string, string>
			: never;

/**
 * Maps a GLTF type to its result type with NgtObjectMap for easy access to nodes and materials.
 */
type InjectGLTFObjectMap<TGltf extends GLTF | GLTF[] | Record<string, GLTF>> = TGltf extends GLTF
	? TGltf & NgtObjectMap
	: TGltf extends Array<infer _GLTF extends GLTF>
		? Array<_GLTF & NgtObjectMap>
		: TGltf extends Record<string, infer _GLTF extends GLTF>
			? Record<string, _GLTF & NgtObjectMap>
			: never;

/**
 * Loads GLTF/GLB 3D models with support for Draco compression and Meshopt optimization.
 *
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
		const loaderConfiguration = getLoaderConfiguration(useDraco, useMeshOpt, extensions);
		const result = injectLoader(() => GLTFLoader, path, {
			extensions: loaderConfiguration.extensions,
			cacheKey: () => loaderConfiguration.cacheKey,
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
	const loaderConfiguration = getLoaderConfiguration(useDraco, useMeshOpt, extensions);
	injectLoader.preload(
		() => GLTFLoader,
		path,
		loaderConfiguration.extensions as any,
		// @ts-expect-error - we know the type of the data
		onLoad,
		() => loaderConfiguration.cacheKey,
	);
};

_injectGLTF.setDecoderPath = (path: string) => {
	decoderPath = path;
};

/**
 * Type definition for the injectGLTF function, including its static methods.
 *
 * @deprecated Use gltfResource instead. Will be removed in v5.0.0
 */
export type NgtsGLTFLoader = typeof _injectGLTF;

/**
 * Injectable function for loading GLTF/GLB 3D models.
 *
 * Supports Draco compression and Meshopt optimization out of the box.
 * Returns a signal with the loaded GLTF data including an NgtObjectMap
 * for easy access to nodes and materials by name.
 *
 * Includes static methods:
 * - `preload`: Preload models into cache
 * - `setDecoderPath`: Set custom Draco decoder path
 *
 * @deprecated Use gltfResource instead. Will be removed in v5.0.0
 * @since v4.0.0
 *
 * @example
 * ```typescript
 * // Basic usage
 * const gltf = injectGLTF(() => '/models/robot.glb');
 *
 * // With typed nodes
 * interface RobotGLTF extends GLTF {
 *   nodes: { Head: THREE.Mesh; Body: THREE.Mesh };
 * }
 * const robot = injectGLTF<RobotGLTF>(() => '/models/robot.glb');
 *
 * // Access scene directly
 * const scene = gltf.scene;
 *
 * // Preload
 * injectGLTF.preload(() => '/models/robot.glb');
 * ```
 */
export const injectGLTF: NgtsGLTFLoader = _injectGLTF;
