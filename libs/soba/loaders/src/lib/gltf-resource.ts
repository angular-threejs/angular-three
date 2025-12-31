import { computed, Injector, ResourceRef, Signal } from '@angular/core';
import { loaderResource, type NgtObjectMap } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { DRACOLoader, type GLTF, GLTFLoader, MeshoptDecoder } from 'three-stdlib';

let dracoLoader: DRACOLoader | null = null;
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

/**
 * Maps a GLTF type to its corresponding URL input type.
 */
type GLTFUrl<TGLTF extends GLTF | GLTF[] | Record<string, GLTF>> = TGLTF extends GLTF
	? string
	: TGLTF extends GLTF[]
		? string[]
		: TGLTF extends Record<string, GLTF>
			? Record<string, string>
			: never;

/**
 * Maps a GLTF type to its result type with NgtObjectMap for easy access to nodes and materials.
 */
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

/**
 * Maps a GLTF type to its scene type(s).
 */
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

/**
 * Creates a resource for loading GLTF/GLB 3D models using Angular's resource API.
 *
 * This function wraps the GLTFLoader from three-stdlib and provides a reactive
 * resource-based approach to loading GLTF files. It supports Draco compression
 * and Meshopt optimization out of the box.
 *
 * The returned resource includes a `scene` computed signal for direct access to
 * the loaded scene(s).
 *
 * @param input - A function returning the URL(s) of the GLTF/GLB file(s) to load
 * @param options - Configuration options
 * @param options.useDraco - Enable Draco compression support. Pass a string to specify custom decoder path
 * @param options.useMeshOpt - Enable Meshopt optimization support
 * @param options.injector - Optional injector for dependency injection context
 * @param options.extensions - Custom extensions callback for the GLTFLoader
 * @param options.onLoad - Callback fired when loading completes
 * @returns A ResourceRef containing the loaded GLTF data with a `scene` signal
 *
 * @example
 * ```typescript
 * // Basic usage
 * const gltf = gltfResource(() => '/models/robot.glb');
 *
 * // With typed nodes
 * interface RobotGLTF extends GLTF {
 *   nodes: { Head: THREE.Mesh; Body: THREE.Mesh };
 * }
 * const robot = gltfResource<RobotGLTF>(() => '/models/robot.glb');
 *
 * // Access scene directly via computed signal
 * effect(() => {
 *   const scene = robot.scene();
 *   if (scene) { ... }
 * });
 *
 * // Disable Draco
 * const gltf = gltfResource(() => '/models/simple.glb', { useDraco: false });
 * ```
 */
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
		/** Enable Draco compression. Pass string for custom decoder path. @default true */
		useDraco?: boolean | string;
		/** Enable Meshopt optimization. @default true */
		useMeshOpt?: boolean;
		/** Optional injector for DI context */
		injector?: Injector;
		/** Custom extensions callback for GLTFLoader */
		extensions?: (loader: GLTFLoader) => void;
		/** Callback fired when loading completes */
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

/**
 * Preloads GLTF/GLB models into the cache for faster subsequent loading.
 *
 * @param input - The URL(s) of the GLTF/GLB file(s) to preload
 * @param options - Configuration options
 * @param options.useDraco - Enable Draco compression support
 * @param options.useMeshOpt - Enable Meshopt optimization support
 * @param options.extensions - Custom extensions callback for the GLTFLoader
 *
 * @example
 * ```typescript
 * // Preload a model
 * gltfResource.preload('/models/robot.glb');
 *
 * // Preload with custom Draco decoder path
 * gltfResource.preload('/models/robot.glb', { useDraco: '/draco/' });
 * ```
 */
gltfResource.preload = <TUrl extends string | string[] | Record<string, string>>(
	input: TUrl,
	{
		useDraco = true,
		useMeshOpt = true,
		extensions,
	}: {
		/** Enable Draco compression. Pass string for custom decoder path. @default true */
		useDraco?: boolean | string;
		/** Enable Meshopt optimization. @default true */
		useMeshOpt?: boolean;
		/** Custom extensions callback for GLTFLoader */
		extensions?: (loader: GLTFLoader) => void;
	} = {},
) => {
	loaderResource.preload(GLTFLoader, input, _extensions(useDraco, useMeshOpt, extensions));
};

/**
 * Sets the global Draco decoder path for all subsequent GLTF loads.
 *
 * @param path - The URL path to the Draco decoder files
 *
 * @example
 * ```typescript
 * // Use local Draco decoder files
 * gltfResource.setDecoderPath('/draco/');
 * ```
 */
gltfResource.setDecoderPath = (path: string) => {
	decoderPath = path;
};
