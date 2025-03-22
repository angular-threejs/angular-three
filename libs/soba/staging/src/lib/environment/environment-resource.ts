import { computed, effect, Injector, signal, untracked } from '@angular/core';
import { GainMapLoader, HDRJPGLoader } from '@monogrid/gainmap-js';
import { injectStore, is, loaderResource, pick } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { EXRLoader, RGBELoader } from 'three-stdlib';

export const ENVIRONMENT_PRESETS = {
	apartment: 'lebombo_1k.hdr',
	city: 'potsdamer_platz_1k.hdr',
	dawn: 'kiara_1_dawn_1k.hdr',
	forest: 'forest_slope_1k.hdr',
	lobby: 'st_fagans_interior_1k.hdr',
	night: 'dikhololo_night_1k.hdr',
	park: 'rooitou_park_1k.hdr',
	studio: 'studio_small_03_1k.hdr',
	sunset: 'venice_sunset_1k.hdr',
	warehouse: 'empty_warehouse_01_1k.hdr',
};

export type NgtsEnvironmentPresets = keyof typeof ENVIRONMENT_PRESETS;

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/';

export interface NgtsEnvironmentResourceOptions {
	files: string | string[];
	path: string;
	preset?: NgtsEnvironmentPresets;
	extensions?: (loader: THREE.Loader) => void;
	colorSpace?: THREE.ColorSpace;
}

const defaultFiles = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'];

export function environmentResource(
	options: () => Partial<NgtsEnvironmentResourceOptions> = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(environmentResource, injector, () => {
		const adjustedOptions = computed(() => {
			const { preset, extensions, colorSpace, ...rest } = options();
			let { files, path } = rest;

			if (files == null) {
				files = defaultFiles;
			}

			if (path == null) {
				path = '';
			}

			if (preset) {
				validatePreset(preset);
				files = ENVIRONMENT_PRESETS[preset];
				path = CUBEMAP_ROOT;
			}

			return { files, preset, colorSpace, path, extensions };
		});

		const files = pick(adjustedOptions, 'files');
		const multiFile = computed(() => Array.isArray(files()));
		const resultOptions = computed(() => getExtension(files()));
		const extension = pick(resultOptions, 'extension');
		const loader = computed(() => getLoader(extension()));

		const store = injectStore();

		const texture = signal<THREE.Texture | THREE.CubeTexture | null>(null);

		effect(() => {
			const [_extension, _multiFile, _files] = [untracked(extension), untracked(multiFile), files()];
			if (_extension !== 'webp' && _extension !== 'jpg' && _extension !== 'jpeg') return;
			store.gl().domElement.addEventListener(
				'webglcontextlost',
				() => {
					// @ts-expect-error - files is correctly passed
					loaderResource.clear(multiFile ? [_files] : _files);
				},
				{ once: true },
			);
		});

		const resource = loaderResource(
			loader,
			// @ts-expect-error - ensure the files is an array
			() => {
				const { files } = adjustedOptions();
				return Array.isArray(files) ? [files] : files;
			},
			{
				extensions: (loader) => {
					const { extensions, path } = adjustedOptions();
					const { extension } = resultOptions();
					if (extension === 'webp' || extension === 'jpg' || extension === 'jpeg') {
						// @ts-expect-error - Gainmap requires a renderer
						loader.setRenderer(store.gl());
					}

					loader.setPath?.(path);
					if (extensions) extensions(loader);
				},
			},
		);

		effect(() => {
			const loaderResult = resource.value();
			if (!loaderResult) return;

			const { extension, isCubeMap } = untracked(resultOptions);
			const _multiFile = untracked(multiFile);
			const { colorSpace } = untracked(adjustedOptions);

			// @ts-expect-error - ensure textureResult is a Texture or CubeTexture
			let textureResult = (_multiFile ? loaderResult[0] : loaderResult) as Texture | CubeTexture;

			// NOTE: racing condition, we can skip this
			//  we just said above that if multiFile is false, it is a single Texture
			if (
				!_multiFile &&
				Array.isArray(textureResult) &&
				is.three<THREE.CubeTexture>(textureResult[0], 'isCubeTexture')
			) {
				return;
			}

			if (
				!is.three<THREE.CubeTexture>(textureResult, 'isCubeTexture') &&
				(extension === 'jpg' || extension === 'jpeg' || extension === 'webp')
			) {
				textureResult = textureResult.renderTarget?.texture;
			}

			textureResult.mapping = isCubeMap ? THREE.CubeReflectionMapping : THREE.EquirectangularReflectionMapping;
			textureResult.colorSpace = colorSpace ?? (isCubeMap ? 'srgb' : 'srgb-linear');

			texture.set(textureResult);
		});

		return { texture: texture.asReadonly(), resource };
	});
}

environmentResource.preload = (options: Partial<NgtsEnvironmentResourceOptions> = {}) => {
	let { files, path } = options;
	const { preset, extensions } = options;

	if (files == null) {
		files = defaultFiles;
	}

	if (path == null) {
		path = '';
	}

	if (preset) {
		validatePreset(preset);
		files = ENVIRONMENT_PRESETS[preset];
		path = CUBEMAP_ROOT;
	}

	const { extension } = getExtension(files);

	if (extension === 'webp' || extension === 'jpg' || extension === 'jpeg') {
		throw new Error('injectEnvironment: Preloading gainmaps is not supported');
	}

	const loader = getLoader(extension);
	if (!loader) throw new Error('injectEnvironment: Unrecognized file extension: ' + files);

	loaderResource.preload(
		loader,
		// @ts-expect-error - files is correctly passed
		Array.isArray(files) ? [files] : files,
		(loader) => {
			loader.setPath?.(path);
			if (extensions) extensions(loader);
		},
	);
};

environmentResource.clear = (clearOptions: { files?: string | string[]; preset?: NgtsEnvironmentPresets }) => {
	const options = { files: defaultFiles, ...clearOptions };
	let { files } = options;
	const preset = options.preset;

	if (preset) {
		validatePreset(preset);
		files = ENVIRONMENT_PRESETS[preset];
	}

	loaderResource.clear(files);
};

function validatePreset(preset: string) {
	if (!(preset in ENVIRONMENT_PRESETS))
		throw new Error('Preset must be one of: ' + Object.keys(ENVIRONMENT_PRESETS).join(', '));
}

function getExtension(files: string | string[]) {
	const isCubeMap = Array.isArray(files) && files.length === 6;
	const isGainmap = Array.isArray(files) && files.length === 3 && files.some((file) => file.endsWith('json'));
	const firstEntry = Array.isArray(files) ? files[0] : files;

	// Everything else
	const extension: string | false | undefined = isCubeMap
		? 'cube'
		: isGainmap
			? 'webp'
			: firstEntry.startsWith('data:application/exr')
				? 'exr'
				: firstEntry.startsWith('data:application/hdr')
					? 'hdr'
					: firstEntry.startsWith('data:image/jpeg')
						? 'jpg'
						: firstEntry.split('.').pop()?.split('?')?.shift()?.toLowerCase();

	return { extension, isCubeMap, isGainmap };
}

function getLoader(extension: string | undefined) {
	const loader =
		extension === 'cube'
			? THREE.CubeTextureLoader
			: extension === 'hdr'
				? RGBELoader
				: extension === 'exr'
					? EXRLoader
					: extension === 'jpg' || extension === 'jpeg'
						? (HDRJPGLoader as unknown as typeof THREE.Loader)
						: extension === 'webp'
							? (GainMapLoader as unknown as typeof THREE.Loader)
							: null;

	if (!loader) {
		throw new Error('injectEnvironment: Unrecognized file extension: ' + extension);
	}

	return loader as typeof THREE.Loader;
}
