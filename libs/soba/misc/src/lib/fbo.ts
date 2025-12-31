import {
	DestroyRef,
	Directive,
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

/**
 * Parameters for creating a Frame Buffer Object (FBO).
 */
export interface NgtsFBOParams {
	/**
	 * Width of the render target in pixels, or RenderTargetOptions if height is not provided.
	 * Defaults to canvas width × device pixel ratio.
	 */
	width?: number | THREE.RenderTargetOptions;

	/**
	 * Height of the render target in pixels.
	 * Defaults to canvas height × device pixel ratio.
	 */
	height?: number;

	/**
	 * Additional THREE.RenderTargetOptions for the WebGLRenderTarget.
	 */
	settings?: THREE.RenderTargetOptions;
}

/**
 * Creates a WebGLRenderTarget (Frame Buffer Object) for off-screen rendering.
 *
 * Automatically sized to the canvas dimensions if width/height not specified.
 * The FBO is disposed on component destroy.
 *
 * @param params - Signal of FBO configuration
 * @param options - Optional configuration
 * @param options.injector - Custom injector for dependency injection context
 * @returns A THREE.WebGLRenderTarget instance
 *
 * @example
 * ```typescript
 * // Basic usage - sized to canvas
 * const renderTarget = fbo();
 *
 * // Custom size with multisampling
 * const target = fbo(() => ({
 *   width: 512,
 *   height: 512,
 *   settings: { samples: 4 }
 * }));
 *
 * // Render to FBO
 * beforeRender(({ gl, scene, camera }) => {
 *   gl.setRenderTarget(target);
 *   gl.render(scene, camera);
 *   gl.setRenderTarget(null);
 * });
 * ```
 */
export function fbo(params: () => NgtsFBOParams = () => ({}), { injector }: { injector?: Injector } = {}) {
	return assertInjector(fbo, injector, () => {
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
			const _settings = (typeof width === 'number' ? settings : (width as THREE.RenderTargetOptions)) || {};
			if (_settings.samples === undefined) {
				_settings.samples = 0;
			}
			return _settings;
		});

		const target = (() => {
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
		})();

		effect(() => {
			const [{ samples = 0 }, _width, _height] = [settings(), width(), height()];
			target.setSize(_width, _height);
			if (samples) target.samples = samples;
		});

		inject(DestroyRef).onDestroy(() => target.dispose());

		return target;
	});
}

/**
 * @deprecated Use `fbo` instead. Will be removed in v5.0.0.
 * @since v4.0.0
 * @see fbo
 */
export const injectFBO = fbo;

/**
 * Structural directive for creating an FBO with template context.
 *
 * Provides the created WebGLRenderTarget as implicit context to the template.
 *
 * @example
 * ```html
 * <ng-template [fbo]="{ width: 512, height: 512 }" let-target>
 *   <!-- target is the WebGLRenderTarget -->
 *   <ngt-mesh>
 *     <ngt-plane-geometry />
 *     <ngt-mesh-basic-material [map]="target.texture" />
 *   </ngt-mesh>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[fbo]' })
export class NgtsFBO {
	/**
	 * FBO configuration including width, height, and RenderTargetOptions.
	 */
	fbo = input({} as { width: NgtsFBOParams['width']; height: NgtsFBOParams['height'] } & THREE.RenderTargetOptions);

	private template = inject(TemplateRef);
	private viewContainerRef = inject(ViewContainerRef);

	constructor() {
		const fboTarget = fbo(() => {
			const { width, height, ...settings } = this.fbo();
			return { width, height, settings };
		});

		effect((onCleanup) => {
			const ref = this.viewContainerRef.createEmbeddedView(this.template, { $implicit: fboTarget });
			ref.detectChanges();
			onCleanup(() => void ref.destroy());
		});
	}

	/**
	 * Type guard for template context.
	 * Ensures the implicit context is typed as WebGLRenderTarget.
	 */
	static ngTemplateContextGuard(_: NgtsFBO, ctx: unknown): ctx is { $implicit: ReturnType<typeof fbo> } {
		return true;
	}
}
