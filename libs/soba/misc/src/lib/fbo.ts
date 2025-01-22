import {
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	Injector,
	TemplateRef,
	ViewContainerRef,
	computed,
	effect,
	inject,
	input,
	untracked,
} from '@angular/core';
import { injectStore } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { TextureEncoding } from './deprecated';

interface FBOSettings {
	/** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
	samples?: number;
	/** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
	depth?: boolean;

	// WebGLRenderTargetOptions => RenderTargetOptions
	wrapS?: THREE.Wrapping | undefined;
	wrapT?: THREE.Wrapping | undefined;
	magFilter?: THREE.MagnificationTextureFilter | undefined;
	minFilter?: THREE.MinificationTextureFilter | undefined;
	format?: number | undefined; // RGBAFormat;
	type?: THREE.TextureDataType | undefined; // UnsignedByteType;
	anisotropy?: number | undefined; // 1;
	depthBuffer?: boolean | undefined; // true;
	stencilBuffer?: boolean | undefined; // false;
	generateMipmaps?: boolean | undefined; // true;
	depthTexture?: THREE.DepthTexture | undefined;
	encoding?: TextureEncoding | undefined;
	colorSpace?: THREE.ColorSpace | undefined;
}

export interface NgtsFBOParams {
	width?: number | FBOSettings;
	height?: number;
	settings?: FBOSettings;
}

export function injectFBO(params: () => NgtsFBOParams = () => ({}), { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectFBO, injector, () => {
		const store = injectStore();

		const width = computed(() => {
			const { width } = params();
			return typeof width === 'number' ? width : store.size.width() * store.viewport.dpr();
		});

		const height = computed(() => {
			const { height } = params();
			return typeof height === 'number' ? height : store.size.height() * store.viewport.dpr();
		});

		const settings = computed(() => {
			const { width, settings } = params();
			const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {};
			if (_settings.samples === undefined) {
				_settings.samples = 0;
			}
			return _settings;
		});

		const target = computed(() => {
			const [{ samples = 0, depth, ...targetSettings }, _width, _height] = [
				untracked(settings),
				untracked(width),
				untracked(height),
			];

			const target = new THREE.WebGLRenderTarget(_width, _height, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				type: THREE.HalfFloatType,
				...targetSettings,
			});

			if (depth) {
				target.depthTexture = new THREE.DepthTexture(_width, _height, THREE.FloatType);
			}

			target.samples = samples;
			return target;
		});

		effect(() => {
			const [{ samples = 0 }, _width, _height, _target] = [settings(), width(), height(), target()];
			_target.setSize(_width, _height);
			if (samples) _target.samples = samples;
		});

		inject(DestroyRef).onDestroy(() => target().dispose());

		return target;
	});
}

@Directive({ selector: 'ng-template[fbo]' })
export class NgtsFBO {
	fbo = input({} as { width: NgtsFBOParams['width']; height: NgtsFBOParams['height'] } & FBOSettings);

	private template = inject(TemplateRef);
	private viewContainerRef = inject(ViewContainerRef);

	constructor() {
		let ref: EmbeddedViewRef<{ $implicit: ReturnType<typeof injectFBO> }>;

		const fboTarget = injectFBO(() => {
			const { width, height, ...settings } = this.fbo();
			return { width, height, settings };
		});

		effect(() => {
			ref = this.viewContainerRef.createEmbeddedView(this.template, { $implicit: fboTarget });
			ref.detectChanges();
		});

		inject(DestroyRef).onDestroy(() => {
			ref?.destroy();
		});
	}

	static ngTemplateContextGuard(_: NgtsFBO, ctx: unknown): ctx is { $implicit: ReturnType<typeof injectFBO> } {
		return true;
	}
}
