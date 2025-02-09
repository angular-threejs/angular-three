import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	Directive,
	effect,
	EffectRef,
	ElementRef,
	inject,
	Injector,
	input,
	output,
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
	NgtEuler,
	NgtPortal,
	pick,
} from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { CubeCamera } from 'three';
import { GroundProjectedEnv } from 'three-stdlib';
import { injectEnvironment, NgtsEnvironmentPresets, NgtsInjectEnvironmentOptions } from './inject-environment';

function resolveScene(scene: THREE.Scene | ElementRef<THREE.Scene>) {
	return is.ref(scene) ? scene.nativeElement : scene;
}

function setEnvProps(
	background: boolean | 'only',
	scene: THREE.Scene | ElementRef<THREE.Scene> | undefined,
	defaultScene: THREE.Scene,
	texture: THREE.Texture,
	sceneProps: Partial<NgtsEnvironmentOptions> = {},
) {
	sceneProps.backgroundBlurriness ??= sceneProps.blur ?? 0;
	sceneProps.backgroundIntensity ??= 1;
	sceneProps.backgroundRotation ??= [0, 0, 0];
	sceneProps.environmentIntensity ??= 1;
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
	backgroundRotation?: NgtEuler;
	environmentIntensity?: number;
	environmentRotation?: NgtEuler;

	map?: THREE.Texture;
	preset?: NgtsEnvironmentPresets;
	scene?: THREE.Scene | ElementRef<THREE.Scene>;
	ground?: boolean | { radius?: number; height?: number; scale?: number };
}

const defaultBackground: NgtsEnvironmentOptions = {
	background: false,
};

@Directive({ selector: 'ngts-environment-map' })
export class NgtsEnvironmentMap {
	options = input(defaultBackground, { transform: mergeInputs(defaultBackground) });
	envSet = output<void>();

	constructor() {
		const store = injectStore();

		const _map = pick(this.options, 'map');
		const _envConfig = computed(() => {
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

		effect((onCleanup) => {
			const map = _map();
			if (!map) return;
			const { background = false, scene, ...config } = _envConfig();
			const cleanup = setEnvProps(background, scene, store.scene(), map, config);
			this.envSet.emit();
			onCleanup(() => cleanup());
		});
	}
}

@Directive({ selector: 'ngts-environment-cube' })
export class NgtsEnvironmentCube {
	options = input(defaultBackground, { transform: mergeInputs(defaultBackground) });
	envSet = output<void>();

	private store = injectStore();

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
		const _texture = injectEnvironment(this.options);

		effect((onCleanup) => {
			const texture = _texture();
			if (!texture) return;
			const { background = false, scene, ...config } = this.envConfig();
			const cleanup = setEnvProps(background, scene, this.store.scene(), texture, config);
			this.envSet.emit();
			onCleanup(() => cleanup());
		});

		inject(DestroyRef).onDestroy(() => {
			_texture()?.dispose();
		});
	}
}

@Component({
	selector: 'ngts-environment-portal',
	template: `
		<ngt-portal [container]="virtualScene">
			<ng-template portalContent let-injector="injector">
				<ng-container
					[ngTemplateOutlet]="content()"
					[ngTemplateOutletInjector]="injector"
					[ngTemplateOutletContext]="{ injector, container: virtualScene }"
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
	imports: [NgtsEnvironmentCube, NgtsEnvironmentMap, NgtArgs, NgtPortal, NgTemplateOutlet],
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

	private injector = inject(Injector);
	private store = injectStore();

	private cameraRef = viewChild<ElementRef<THREE.CubeCamera>>('cubeCamera');

	protected map = pick(this.options, 'map');
	protected files = pick(this.options, 'files');
	protected preset = pick(this.options, 'preset');
	private extensions = pick(this.options, 'extensions');
	private path = pick(this.options, 'path');

	protected envMapOptions = computed(() => ({ background: true, map: this.map(), extensions: this.extensions() }));
	protected envCubeOptions = computed(() => ({
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
		const fbo = new THREE.WebGLCubeRenderTarget(this.resolution());
		fbo.texture.type = THREE.HalfFloatType;
		return fbo;
	});

	protected cameraArgs = computed(() => [this.near(), this.far(), this.fbo()]);
	protected virtualScene = new THREE.Scene();

	private setEnvEffectRef?: EffectRef;

	constructor() {
		extend({ CubeCamera });

		effect((onCleanup) => {
			const [files, preset, map] = [this.files(), this.preset(), this.map()];
			// NOTE: when there's none of this, we don't render cube or map so we need to setEnv here
			if (!!files || !!preset || !!map) return;
			const cleanup = this.setPortalEnv();
			onCleanup(() => cleanup?.());
		});

		let count = 1;
		injectBeforeRender(() => {
			const frames = this.options().frames;
			if (frames === Infinity || (frames != null && count < frames)) {
				const camera = this.cameraRef()?.nativeElement;
				if (camera) {
					camera.update(this.store.snapshot.gl, this.virtualScene);
					count++;
				}
			}
		});

		inject(DestroyRef).onDestroy(() => {
			if (this.setEnvEffectRef) this.setEnvEffectRef.destroy();
		});
	}

	// NOTE: we use onEnvSet here to ensure that EnvironmentCube or EnvironmentMap sets the env before the portal
	onEnvSet() {
		if (this.setEnvEffectRef) this.setEnvEffectRef.destroy();
		this.setEnvEffectRef = effect(
			(onCleanup) => {
				const cleanup = this.setPortalEnv();
				onCleanup(() => cleanup?.());
			},
			{ manualCleanup: true, injector: this.injector },
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
		] = [this.options(), this.store.gl(), this.fbo(), this.store.scene()];

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

	private defaultTexture = injectEnvironment(this.options);

	protected height = computed(() => (this.options().ground as any)?.height);
	protected radius = computed(() => (this.options().ground as any)?.radius);
	protected scale = computed(() => (this.options().ground as any)?.scale ?? 1000);
	protected args = computed(() => [this.options().map || this.defaultTexture()]);
	protected envMapOptions = computed(() => {
		const { map: _, ...options } = this.options();
		const [map] = this.args();
		return Object.assign(options, { map }) as NgtsEnvironmentOptions;
	});

	constructor() {
		extend({ GroundProjectedEnv });
	}
}

@Component({
	selector: 'ngts-environment',
	template: `
		@let _options = options();
		@let _content = content();

		@if (_options.ground) {
			<ngts-environment-ground [options]="_options" (envSet)="envSet.emit()" />
		} @else if (_options.map) {
			<ngts-environment-map [options]="_options" (envSet)="envSet.emit()" />
		} @else if (_content) {
			<ngts-environment-portal [options]="_options" [content]="_content" (envSet)="envSet.emit()" />
		} @else {
			<ngts-environment-cube [options]="_options" (envSet)="envSet.emit()" />
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
