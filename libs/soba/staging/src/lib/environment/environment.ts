import { NgTemplateOutlet } from '@angular/common';
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	EffectRef,
	ElementRef,
	inject,
	Injector,
	input,
	output,
	signal,
	TemplateRef,
	viewChild,
} from '@angular/core';
import {
	applyProps,
	extend,
	injectBeforeRender,
	injectStore,
	is,
	NgtArgs,
	NgtPortal,
	NgtPortalContent,
	pick,
	prepare,
} from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { CubeCamera, Euler, HalfFloatType, Scene, Texture, WebGLCubeRenderTarget } from 'three';
import { GroundProjectedEnv } from 'three-stdlib';
import { injectEnvironment, NgtsEnvironmentPresets, NgtsInjectEnvironmentOptions } from './inject-environment';

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

const defaultBackground: NgtsEnvironmentOptions = {
	background: false,
};

@Directive({ standalone: true, selector: 'ngts-environment-map' })
export class NgtsEnvironmentMap {
	options = input(defaultBackground, { transform: mergeInputs(defaultBackground) });
	envSet = output<void>();

	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private defaultScene = this.store.select('scene');

	private envConfig = computed(() => {
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

	private map = pick(this.options, 'map');

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const map = this.map();
				if (!map) return;
				const { background = false, scene, ...config } = this.envConfig();
				const cleanup = setEnvProps(background, scene, this.defaultScene(), map, config);
				this.envSet.emit();
				return () => cleanup();
			});
		});
	}
}

@Directive({ standalone: true, selector: 'ngts-environment-cube' })
export class NgtsEnvironmentCube {
	options = input(defaultBackground, { transform: mergeInputs(defaultBackground) });
	envSet = output<void>();

	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private defaultScene = this.store.select('scene');
	private injector = inject(Injector);

	private envConfig = computed(() => {
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

	constructor() {
		afterNextRender(() => {
			const _texture = injectEnvironment(this.options, { injector: this.injector });

			this.autoEffect(() => {
				const texture = _texture();
				if (!texture) return;
				const { background = false, scene, ...config } = this.envConfig();
				const cleanup = setEnvProps(background, scene, this.defaultScene(), texture, config);
				this.envSet.emit();
				return () => cleanup();
			});
		});
	}
}

@Component({
	selector: 'ngts-environment-portal',
	standalone: true,
	template: `
		<ngt-portal [container]="virtualScene">
			<ng-template portalContent let-injector="injector" let-container="container">
				<ng-container
					[ngTemplateOutlet]="content()"
					[ngTemplateOutletInjector]="injector"
					[ngTemplateOutletContext]="{ injector, container }"
				/>

				<ngt-cube-camera #cubeCamera *args="cameraArgs()" />

				@if (files() || preset()) {
					<ngts-environment-cube [options]="envCubeOptions()" (envSet)="onEnvSet()" />
				} @else if (map()) {
					<ngts-environment-map [options]="envMapOptions()" (envSet)="onEnvSet()" />
				}
			</ng-template>
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
	envSet = output<void>();

	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private defaultScene = this.store.select('scene');
	private gl = this.store.select('gl');

	cameraRef = viewChild<ElementRef<CubeCamera>>('cubeCamera');

	map = pick(this.options, 'map');
	files = pick(this.options, 'files');
	preset = pick(this.options, 'preset');
	private extensions = pick(this.options, 'extensions');
	private path = pick(this.options, 'path');

	envMapOptions = computed(() => ({ background: true, map: this.map(), extensions: this.extensions() }));
	envCubeOptions = computed(() => ({
		background: true,
		files: this.files(),
		preset: this.preset(),
		extensions: this.extensions(),
		path: this.path(),
	}));

	private near = pick(this.options, 'near');
	private far = pick(this.options, 'far');
	private resolution = pick(this.options, 'resolution');
	private fbo = computed(() => {
		const fbo = new WebGLCubeRenderTarget(this.resolution());
		fbo.texture.type = HalfFloatType;
		return fbo;
	});

	cameraArgs = computed(() => [this.near(), this.far(), this.fbo()]);

	virtualScene = prepare(new Scene());

	private setEnvEffectRef?: EffectRef;

	constructor() {
		extend({ CubeCamera });

		afterNextRender(() => {
			this.autoEffect(() => {
				const [files, preset, map] = [this.files(), this.preset(), this.map()];
				// NOTE: when there's none of this, we don't render cube or map so we need to setEnv here
				if (!!files || !!preset || !!map) return;
				return this.setPortalEnv();
			});
		});

		let count = 1;
		injectBeforeRender(() => {
			const frames = this.options().frames;
			if (frames === Infinity || (frames != null && count < frames)) {
				const camera = this.cameraRef()?.nativeElement;
				if (camera) {
					camera.update(this.gl(), this.virtualScene);
					count++;
				}
			}
		});
	}

	// NOTE: we use onEnvSet here to ensure that EnvironmentCube or EnvironmentMap sets the env before the portal
	onEnvSet() {
		if (this.setEnvEffectRef) this.setEnvEffectRef.destroy();
		this.setEnvEffectRef = this.autoEffect(
			() => {
				return this.setPortalEnv();
			},
			{ manualCleanup: true },
		);
	}

	private setPortalEnv() {
		const camera = this.cameraRef();
		if (!camera?.nativeElement) return;

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

		if (frames === 1) camera.nativeElement.update(gl, this.virtualScene);
		const cleanup = setEnvProps(background, scene, defaultScene, fbo.texture, {
			blur,
			backgroundBlurriness,
			backgroundIntensity,
			backgroundRotation,
			environmentIntensity,
			environmentRotation,
		});
		this.envSet.emit();
		return cleanup;
	}
}

@Component({
	selector: 'ngts-environment-ground',
	standalone: true,
	template: `
		<ngts-environment-map [options]="envMapOptions()" (envSet)="envSet.emit()" />
		<ngt-ground-projected-env *args="args()" [scale]="scale()" [height]="height()" [radius]="radius()" />
	`,
	imports: [NgtsEnvironmentMap, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsEnvironmentGround {
	options = input({} as NgtsEnvironmentOptions);
	envSet = output<void>();

	args = signal<[Texture | null]>([null]);

	height = computed(() => (this.options().ground as any)?.height);
	radius = computed(() => (this.options().ground as any)?.radius);
	scale = computed(() => (this.options().ground as any)?.scale ?? 1000);

	envMapOptions = computed(() => {
		const { map: _, ...options } = this.options();
		const [map] = this.args();
		return Object.assign(options, { map }) as NgtsEnvironmentOptions;
	});

	constructor() {
		extend({ GroundProjectedEnv });

		const injector = inject(Injector);
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			const defaultTexture = injectEnvironment(this.options, { injector });
			const texture = computed(() => this.options().map || defaultTexture());

			autoEffect(
				() => {
					this.args.set([texture()]);
				},
				{ allowSignalWrites: true },
			);
		});
	}
}

@Component({
	selector: 'ngts-environment',
	standalone: true,
	template: `
		@if (options().ground) {
			<ngts-environment-ground [options]="options()" (envSet)="envSet.emit()" />
		} @else if (options().map) {
			<ngts-environment-map [options]="options()" (envSet)="envSet.emit()" />
		} @else if (content()) {
			<ngts-environment-portal [options]="options()" [content]="$any(content())" (envSet)="envSet.emit()" />
		} @else {
			<ngts-environment-cube [options]="options()" (envSet)="envSet.emit()" />
		}
	`,
	imports: [NgtsEnvironmentCube, NgtsEnvironmentMap, NgtsEnvironmentPortal, NgtsEnvironmentGround],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsEnvironment {
	options = input({} as NgtsEnvironmentOptions);
	content = contentChild(TemplateRef);
	envSet = output<void>();
}
