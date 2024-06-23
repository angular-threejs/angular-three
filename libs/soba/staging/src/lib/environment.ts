import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	Injector,
	TemplateRef,
	afterNextRender,
	computed,
	contentChild,
	inject,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { GainMapLoader, HDRJPGLoader } from '@monogrid/gainmap-js';
import {
	NgtArgs,
	NgtPortal,
	NgtPortalContent,
	applyProps,
	extend,
	injectLoader,
	injectNextBeforeRender,
	injectNgtStore,
	is,
	prepare,
} from 'angular-three';
import { LinearEncoding, NgtsContent, TextureEncoding, sRGBEncoding } from 'angular-three-soba/misc';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	CubeCamera,
	CubeReflectionMapping,
	CubeTexture,
	CubeTextureLoader,
	EquirectangularReflectionMapping,
	Euler,
	HalfFloatType,
	Loader,
	Scene,
	Texture,
	WebGLCubeRenderTarget,
} from 'three';
import { EXRLoader, GroundProjectedEnv, RGBELoader } from 'three-stdlib';

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/';

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

function resolveScene(scene: Scene | ElementRef<Scene>) {
	return is.ref(scene) ? scene.nativeElement : scene;
}

function setEnvProps(
	background: boolean | 'only',
	scene: Scene | ElementRef<Scene> | undefined,
	defaultScene: Scene,
	texture: Texture,
	sceneProps: Partial<NgtsEnvironmentOptions> = {},
) {
	sceneProps.backgroundBlurriness ??= sceneProps.blur ?? 0;
	sceneProps.backgroundIntensity ??= 1;
	// @ts-expect-error - it's ok, we're sending through applyProps
	sceneProps.backgroundRotation ??= [0, 0, 0];
	sceneProps.environmentIntensity ??= 1;
	// @ts-expect-error - it's ok, we're sending through applyProps
	sceneProps.environmentRotation ??= [0, 0, 0];

	const target = resolveScene(scene || defaultScene);
	const oldbg = target.background;
	const oldenv = target.environment;
	const oldSceneProps = {
		backgroundBlurriness: target.backgroundBlurriness,
		backgroundIntensity: target.backgroundIntensity,
		backgroundRotation: target.backgroundRotation?.clone?.() ?? [0, 0, 0],
		environmentIntensity: target.environmentIntensity,
		environmentRotation: target.environmentRotation?.clone?.() ?? [0, 0, 0],
	};

	if (background !== 'only') target.environment = texture;
	if (background) target.background = texture;
	applyProps(target, sceneProps);

	return () => {
		if (background !== 'only') target.environment = oldenv;
		if (background) target.background = oldbg;
		applyProps(target, oldSceneProps);
	};
}

export interface NgtsInjectEnvironmentOptions {
	files: string | string[];
	path: string;
	preset?: NgtsEnvironmentPresets;
	extensions?: (loader: Loader) => void;
	encoding?: TextureEncoding;
}

export function injectEnvironment(
	options: () => Partial<NgtsInjectEnvironmentOptions> = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectEnvironment, injector, () => {
		const adjustedOptions = computed(() => {
			let { files, path, preset, extensions, encoding } = options();

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

			return { files, preset, encoding, path, extensions };
		});

		const resultOptions = computed(() => {
			const { files } = adjustedOptions();
			const multiFile = Array.isArray(files);

			const isCubeMap = multiFile && files.length === 6;
			const isGainmain = multiFile && files.length === 3 && files.some((file) => file.endsWith('json'));
			const firstEntry = multiFile ? files[0] : files;

			const extension = isCubeMap
				? 'cube'
				: isGainmain
					? 'webp'
					: firstEntry.startsWith('data:application/exr')
						? 'exr'
						: firstEntry.startsWith('data:application/hdr')
							? 'hdr'
							: firstEntry.startsWith('data:image/jpeg')
								? 'jpg'
								: firstEntry.split('.').pop()?.split('?')?.shift()?.toLowerCase();
			return { multiFile, extension, isCubeMap };
		});

		const loader = computed(() => {
			const { extension } = resultOptions();
			const loader =
				extension === 'cube'
					? CubeTextureLoader
					: extension === 'hdr'
						? RGBELoader
						: extension === 'exr'
							? EXRLoader
							: extension === 'jpg' || extension === 'jpeg'
								? (HDRJPGLoader as unknown as typeof Loader)
								: extension === 'webp'
									? (GainMapLoader as unknown as typeof Loader)
									: null;

			if (!loader) {
				throw new Error('injectEnvironment: Unrecognized file extension: ' + extension);
			}

			return loader as typeof Loader;
		});

		const assertedInjector = inject(Injector);
		const autoEffect = injectAutoEffect();
		const store = injectNgtStore();
		const gl = store.select('gl');

		const texture = signal<Texture | CubeTexture | null>(null);
		afterNextRender(() => {
			const result = injectLoader(
				loader,
				// @ts-expect-error
				() => {
					const { files } = adjustedOptions();
					return Array.isArray(files) ? [files] : files;
				},
				{
					injector: assertedInjector,
					extensions: (loader) => {
						const { extensions, path } = adjustedOptions();
						const { extension } = resultOptions();
						if (extension === 'webp' || extension === 'jpg' || extension === 'jpeg') {
							// @ts-expect-error - Gainmap requires a renderer
							loader.setRenderer(gl());
						}

						loader.setPath?.(path);
						if (extensions) extensions(loader);
					},
				},
			);
			//
			autoEffect(() => {
				const loaderResult = result();
				if (!loaderResult) return;

				untracked(() => {
					const { multiFile, extension, isCubeMap } = resultOptions();
					const { encoding } = adjustedOptions();

					// @ts-expect-error
					let textureResult = (multiFile ? loaderResult[0] : loaderResult) as Texture | CubeTexture;

					if (extension === 'jpg' || extension === 'jpeg' || extension === 'webp') {
						textureResult = (textureResult as any).renderTarget?.texture;
					}

					textureResult.mapping = isCubeMap ? CubeReflectionMapping : EquirectangularReflectionMapping;

					if ('colorSpace' in textureResult)
						(textureResult as any).colorSpace = encoding ?? isCubeMap ? 'srgb' : 'srgb-linear';
					else (textureResult as any).encoding = encoding ?? isCubeMap ? sRGBEncoding : LinearEncoding;

					texture.set(textureResult);
				});
			});
		});

		return texture.asReadonly();
	});
}

export interface NgtsEnvironmentOptions extends Partial<NgtsInjectEnvironmentOptions> {
	frames?: number;
	near?: number;
	far?: number;
	resolution?: number;
	background?: boolean | 'only';

	/** deprecated, use backgroundBlurriness */
	blur?: number;
	backgroundBlurriness?: number;
	backgroundIntensity?: number;
	backgroundRotation?: Euler;
	environmentIntensity?: number;
	environmentRotation?: Euler;

	map?: Texture;
	preset?: NgtsEnvironmentPresets;
	scene?: Scene | ElementRef<Scene>;
	ground?: boolean | { radius?: number; height?: number; scale?: number };
}

@Directive({ standalone: true })
export class NgtsEnvironmentOptionsProvider {
	options = input({} as NgtsEnvironmentOptions);

	autoEffect = injectAutoEffect();
	store = injectNgtStore();
	defaultScene = this.store.select('scene');

	envConfig = computed(() => {
		const {
			background = false,
			scene,
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		} = this.options();

		return {
			background,
			scene,
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		};
	});
}

const defaultBackground: NgtsEnvironmentOptions = {
	background: false,
};

@Directive({ standalone: true, selector: 'ngts-environment-map' })
export class NgtsEnvironmentMap {
	options = input(defaultBackground, { transform: mergeInputs(defaultBackground) });

	autoEffect = injectAutoEffect();
	store = injectNgtStore();
	defaultScene = this.store.select('scene');

	envConfig = computed(() => {
		const {
			background = false,
			scene,
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		} = this.options();

		return {
			background,
			scene,
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		};
	});

	map = computed(() => this.options().map);

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const map = this.map();
				if (!map) return;
				const { background = false, scene, ...config } = this.envConfig();
				return setEnvProps(background, scene, this.defaultScene(), map, config);
			});
		});
	}
}

@Directive({ standalone: true, selector: 'ngts-environment-cube' })
export class NgtsEnvironmentCube {
	options = input(defaultBackground, { transform: mergeInputs(defaultBackground) });

	autoEffect = injectAutoEffect();
	store = injectNgtStore();
	defaultScene = this.store.select('scene');

	envConfig = computed(() => {
		const {
			background = false,
			scene,
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		} = this.options();

		return {
			background,
			scene,
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		};
	});

	environmentOptions = computed(() => {
		const { encoding, preset, files, path, extensions } = this.options();
		return { encoding, preset, files, path, extensions };
	});
	texture = injectEnvironment(this.environmentOptions);

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const texture = this.texture();
				if (!texture) return;
				const { background = false, scene, ...config } = this.envConfig();
				return setEnvProps(background, scene, this.defaultScene(), texture, config);
			});
		});
	}
}

@Component({
	selector: 'ngts-environment-portal',
	standalone: true,
	template: `
		<ngt-portal [container]="virtualScene">
			<ng-container [ngTemplateOutlet]="content()" />

			<ngt-cube-camera #cubeCamera *args="cameraArgs()" />

			@if (files() || preset()) {
				<ngts-environment-cube [options]="envCubeOptions()" />
			} @else if (map()) {
				<ngts-environment-map [options]="envMapOptions()" />
			}
		</ngt-portal>
	`,
	imports: [NgtsEnvironmentCube, NgtsEnvironmentMap, NgtArgs, NgtPortal, NgtPortalContent, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsEnvironmentPortal {
	private defaultOptions: NgtsEnvironmentOptions = {
		near: 1,
		far: 1000,
		resolution: 256,
		frames: 1,
		background: false,
	};
	options = input(this.defaultOptions, { transform: mergeInputs(this.defaultOptions) });
	content = input.required<TemplateRef<unknown>>();

	autoEffect = injectAutoEffect();
	store = injectNgtStore();
	defaultScene = this.store.select('scene');
	gl = this.store.select('gl');

	camera = viewChild.required<ElementRef<CubeCamera>>('cubeCamera');

	map = computed(() => this.options().map);
	extensions = computed(() => this.options().extensions);
	files = computed(() => this.options().files);
	path = computed(() => this.options().path);
	preset = computed(() => this.options().preset);

	envMapOptions = computed(() => ({ background: true, map: this.map(), extensions: this.extensions() }));
	envCubeOptions = computed(() => ({
		background: true,
		files: this.files(),
		preset: this.preset(),
		extensions: this.extensions(),
	}));

	private near = computed(() => this.options().near);
	private far = computed(() => this.options().far);
	private resolution = computed(() => this.options().resolution);
	private fbo = computed(() => {
		const fbo = new WebGLCubeRenderTarget(this.resolution());
		fbo.texture.type = HalfFloatType;
		return fbo;
	});

	cameraArgs = computed(() => [this.near(), this.far(), this.fbo()]);

	virtualScene = prepare(new Scene());

	constructor() {
		extend({ CubeCamera });
		afterNextRender(() => {
			this.autoEffect(() => {
				const camera = this.camera();
				if (!camera.nativeElement) return;

				const [
					{
						frames,
						background = false,
						scene,
						blur,
						backgroundBlurriness,
						backgroundIntensity,
						backgroundRotation,
						environmentIntensity,
						environmentRotation,
					},
					gl,
					fbo,
					defaultScene,
				] = [this.options(), this.gl(), this.fbo(), this.defaultScene()];
				if (frames === 1) {
					camera.nativeElement.update(gl, this.virtualScene);
				}
				return setEnvProps(background, scene, defaultScene, fbo.texture, {
					blur,
					backgroundBlurriness,
					backgroundIntensity,
					backgroundRotation,
					environmentIntensity,
					environmentRotation,
				});
			});
		});

		let count = 1;
		injectNextBeforeRender(() => {
			const frames = this.options().frames;
			if (frames === Infinity || (frames != null && count < frames)) {
				const camera = this.camera().nativeElement;
				if (camera) {
					camera.update(this.gl(), this.virtualScene);
					count++;
				}
			}
		});
	}
}

@Component({
	selector: 'ngts-environment-ground',
	standalone: true,
	template: `
		<ngts-environment-map [options]="envMapOptions()" />
		<ngt-ground-projected-env *args="args()" [scale]="scale()" [height]="height()" [radius]="radius()" />
	`,
	imports: [NgtsEnvironmentMap, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsEnvironmentGround {
	options = input({} as NgtsEnvironmentOptions);

	private defaultTexture = injectEnvironment(this.options);
	private texture = computed(() => this.options().map || this.defaultTexture());

	args = computed(() => [this.texture()]);
	height = computed(() => (this.options().ground as any)?.height);
	radius = computed(() => (this.options().ground as any)?.radius);
	scale = computed(() => (this.options().ground as any)?.scale ?? 1000);

	envMapOptions = computed(() => {
		const { map: _, ...options } = this.options();
		return Object.assign(options, { map: this.texture() }) as NgtsEnvironmentOptions;
	});

	constructor() {
		extend({ GroundProjectedEnv });
	}
}

@Component({
	selector: 'ngts-environment',
	standalone: true,
	template: `
		@if (optionsProvider.options().ground) {
			<ngts-environment-ground [options]="optionsProvider.options()" />
		} @else if (optionsProvider.options().map) {
			<ngts-environment-map [options]="optionsProvider.options()" />
		} @else if (content()) {
			<ngts-environment-portal [options]="optionsProvider.options()" [content]="$any(content())" />
		} @else {
			<ngts-environment-cube [options]="optionsProvider.options()" />
		}
	`,
	imports: [NgtsEnvironmentCube, NgtsEnvironmentMap, NgtsEnvironmentPortal, NgtsEnvironmentGround],
	hostDirectives: [{ directive: NgtsEnvironmentOptionsProvider, inputs: ['options'] }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsEnvironment {
	optionsProvider = inject(NgtsEnvironmentOptionsProvider);
	content = contentChild(NgtsContent, { read: TemplateRef });
}
