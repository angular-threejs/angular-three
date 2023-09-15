import {
	ChangeDetectorRef,
	DestroyRef,
	ElementRef,
	Injector,
	computed,
	effect,
	inject,
	runInInjectionContext,
} from '@angular/core';
import { injectNgtLoader, injectNgtRef, is, safeDetectChanges } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { CubeReflectionMapping, CubeTexture, CubeTextureLoader, EquirectangularReflectionMapping } from 'three';
import { EXRLoader, RGBELoader } from 'three-stdlib';
import { ENVIRONMENT_PRESETS } from './assets';
import { type NgtsEnvironmentInputState } from './environment-input';

function resolveScene(scene: THREE.Scene | ElementRef<THREE.Scene>) {
	return is.ref(scene) ? scene.nativeElement : scene;
}

export function setEnvProps(
	background: boolean | 'only',
	scene: THREE.Scene | ElementRef<THREE.Scene> | undefined,
	defaultScene: THREE.Scene,
	texture: THREE.Texture,
	blur = 0,
) {
	const target = resolveScene(scene || defaultScene);
	const oldbg = target.background;
	const oldenv = target.environment;
	const oldBlur = target.backgroundBlurriness || 0;

	if (background !== 'only') target.environment = texture;
	if (background) target.background = texture;
	if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = blur;

	return () => {
		if (background !== 'only') target.environment = oldenv;
		if (background) target.background = oldbg;
		if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = oldBlur;
	};
}

type NgtsInjectEnvironmentParams = Partial<
	Pick<NgtsEnvironmentInputState, 'files' | 'path' | 'preset' | 'extensions' | 'encoding'>
>;

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/';

export function injectNgtsEnvironment(paramsFactory: () => Partial<NgtsInjectEnvironmentParams>, injector?: Injector) {
	injector = assertInjector(injectNgtsEnvironment, injector);
	return runInInjectionContext(injector, () => {
		const textureRef = injectNgtRef<THREE.Texture | CubeTexture>();
		const cdr = inject(ChangeDetectorRef);

		inject(DestroyRef).onDestroy(() => {
			textureRef.nativeElement.dispose();
		});

		const params = computed(() => {
			let { files, preset, encoding, path, extensions } = paramsFactory() as NgtsInjectEnvironmentParams;

			if (files == null) {
				files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'];
			}

			if (path == null) {
				path = '';
			}

			if (preset) {
				if (!(preset in ENVIRONMENT_PRESETS))
					throw new Error('Preset must be one of: ' + Object.keys(ENVIRONMENT_PRESETS).join(', '));
				files = ENVIRONMENT_PRESETS[preset];
				path = CUBEMAP_ROOT;
			}

			return { files, preset, encoding, path, extensions } as NgtsInjectEnvironmentParams;
		});

		const loaderResult = injectNgtLoader(
			// @ts-expect-error
			() => {
				const { files = '' } = params();

				const isCubeMap = Array.isArray(files);
				const extension = Array.isArray(files)
					? 'cube'
					: files.startsWith('data:application/exr')
					? 'exr'
					: files.startsWith('data:application/hdr')
					? 'hdr'
					: files.split('.').pop()?.split('?')?.shift()?.toLowerCase();
				return isCubeMap
					? CubeTextureLoader
					: extension === 'hdr'
					? RGBELoader
					: extension === 'exr'
					? EXRLoader
					: null;
			},
			() => {
				const { files } = params();
				return Array.isArray(files) ? [files] : files;
			},
			{
				extensions: (loader) => {
					const { path, extensions } = params();
					loader.setPath(path);
					if (extensions) extensions(loader);
				},
			},
		);

		const sRGBEncoding = 3001;
		const LinearEncoding = 3000;

		effect(() => {
			const result = loaderResult();
			if (!result) return;
			const { files, encoding } = params();
			const texture: THREE.Texture | THREE.CubeTexture = Array.isArray(files) ? result[0] : result;
			texture.mapping = Array.isArray(files) ? CubeReflectionMapping : EquirectangularReflectionMapping;
			if ('colorSpace' in texture) {
				texture.colorSpace = encoding ?? Array.isArray(files) ? 'srgb' : 'srgb-linear';
			} else {
				(texture as any).encoding = encoding ?? Array.isArray(files) ? sRGBEncoding : LinearEncoding;
			}

			textureRef.nativeElement = texture;
			safeDetectChanges(cdr);
		});

		return textureRef;
	});
}
