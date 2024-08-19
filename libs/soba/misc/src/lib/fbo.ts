import {
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	Injector,
	TemplateRef,
	ViewContainerRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	untracked,
} from '@angular/core';
import { injectStore } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import {
	ColorSpace,
	DepthTexture,
	FloatType,
	HalfFloatType,
	LinearFilter,
	MagnificationTextureFilter,
	MinificationTextureFilter,
	TextureDataType,
	WebGLRenderTarget,
	Wrapping,
} from 'three';
import { TextureEncoding } from './deprecated';

interface FBOSettings {
	/** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
	samples?: number;
	/** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
	depth?: boolean;

	// WebGLRenderTargetOptions => RenderTargetOptions
	wrapS?: Wrapping | undefined;
	wrapT?: Wrapping | undefined;
	magFilter?: MagnificationTextureFilter | undefined;
	minFilter?: MinificationTextureFilter | undefined;
	format?: number | undefined; // RGBAFormat;
	type?: TextureDataType | undefined; // UnsignedByteType;
	anisotropy?: number | undefined; // 1;
	depthBuffer?: boolean | undefined; // true;
	stencilBuffer?: boolean | undefined; // false;
	generateMipmaps?: boolean | undefined; // true;
	depthTexture?: DepthTexture | undefined;
	encoding?: TextureEncoding | undefined;
	colorSpace?: ColorSpace | undefined;
}

export interface NgtsFBOParams {
	width?: number | FBOSettings;
	height?: number;
	settings?: FBOSettings;
}

export function injectFBO(params: () => NgtsFBOParams, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectFBO, injector, () => {
		const store = injectStore();
		const size = store.select('size');
		const viewport = store.select('viewport');

		const width = computed(() => {
			const { width } = params();
			return typeof width === 'number' ? width : size().width * viewport().dpr;
		});
		const height = computed(() => {
			const { height } = params();
			return typeof height === 'number' ? height : size().height * viewport().dpr;
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
			const target = new WebGLRenderTarget(_width, _height, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				type: HalfFloatType,
				...targetSettings,
			});

			if (depth) {
				target.depthTexture = new DepthTexture(_width, _height, FloatType);
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

@Directive({ selector: 'ng-template[fbo]', standalone: true })
export class NgtsFBO {
	fbo = input({} as { width: NgtsFBOParams['width']; height: NgtsFBOParams['height'] } & FBOSettings);

	private template = inject(TemplateRef);
	private viewContainerRef = inject(ViewContainerRef);

	constructor() {
		let ref: EmbeddedViewRef<{ $implicit: ReturnType<typeof injectFBO> }>;
		const injector = inject(Injector);

		afterNextRender(() => {
			const fboTarget = injectFBO(
				() => {
					const { width, height, ...settings } = this.fbo();
					return { width, height, settings };
				},
				{ injector },
			);

			untracked(() => {
				ref = this.viewContainerRef.createEmbeddedView(this.template, { $implicit: fboTarget });
				ref.detectChanges();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			ref?.destroy();
		});
	}

	static ngTemplateContextGuard(_: NgtsFBO, ctx: unknown): ctx is { $implicit: ReturnType<typeof injectFBO> } {
		return true;
	}
}
