import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	Injector,
	TemplateRef,
	computed,
	contentChild,
	effect,
	input,
} from '@angular/core';
import {
	NgtArgs,
	NgtAttachable,
	NgtComputeFunction,
	NgtPortal,
	NgtThreeElements,
	extend,
	getInstanceState,
	injectStore,
	is,
	omit,
	pick,
} from 'angular-three';
import { fbo } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';

/**
 * Configuration options for the NgtsRenderTexture component.
 * Extends the base texture element options from Three.js.
 */
export interface NgtsRenderTextureOptions extends Partial<Omit<NgtThreeElements['ngt-texture'], 'attach'>> {
	/**
	 * Width of the render texture in pixels.
	 * @default viewport width
	 */
	width?: number;
	/**
	 * Height of the render texture in pixels.
	 * @default viewport height
	 */
	height?: number;
	/**
	 * Number of samples for multisampling anti-aliasing (MSAA).
	 * @default 8
	 */
	samples: number;
	/**
	 * Whether to use a stencil buffer.
	 * @default false
	 */
	stencilBuffer: boolean;
	/**
	 * Whether to use a depth buffer.
	 * @default true
	 */
	depthBuffer: boolean;
	/**
	 * Whether to generate mipmaps for the texture.
	 * @default false
	 */
	generateMipmaps: boolean;
	/**
	 * Render priority for the render loop subscription.
	 * @default 0
	 */
	renderPriority: number;
	/**
	 * Event priority for pointer events.
	 * @default 0
	 */
	eventPriority: number;
	/**
	 * Number of frames to render. Set to Infinity for continuous rendering,
	 * or a specific number to render only that many frames.
	 * @default Infinity
	 */
	frames: number;
	/**
	 * Custom compute function for pointer event handling.
	 * Used to transform pointer events for the virtual scene.
	 */
	compute?: (event: any, state: any, previous: any) => false | undefined;
}

/**
 * Internal directive that handles the render loop for the render texture.
 * Manages rendering the virtual scene to the FBO (Frame Buffer Object).
 *
 * @internal
 */
@Directive({ selector: '[renderTextureContainer]' })
export class NgtsRenderTextureContainer {
	/** The WebGL render target (Frame Buffer Object) to render into. */
	fbo = input.required<THREE.WebGLRenderTarget>();
	/** Priority in the render loop. Higher values render later. */
	renderPriority = input.required<number>();
	/** Number of frames to render. Use Infinity for continuous rendering. */
	frames = input.required<number>();

	private store = injectStore();

	constructor() {
		effect((onCleanup) => {
			const [renderPriority, { internal }] = [this.renderPriority(), this.store()];

			let count = 0;
			let oldAutoClear: boolean;
			let oldXrEnabled: boolean;
			let oldRenderTarget: THREE.WebGLRenderTarget | null;
			let oldIsPresenting: boolean;

			const cleanup = internal.subscribe(
				({ gl, scene, camera }) => {
					const [fbo, frames] = [this.fbo(), this.frames()];
					// NOTE: render  the frames ^ 2
					//  due to some race condition, we want to render double the frames here.
					if (frames === Infinity || count < frames * frames) {
						oldAutoClear = gl.autoClear;
						oldXrEnabled = gl.xr.enabled;
						oldRenderTarget = gl.getRenderTarget();
						oldIsPresenting = gl.xr.isPresenting;
						gl.autoClear = true;
						gl.xr.enabled = false;
						gl.xr.isPresenting = false;
						gl.setRenderTarget(fbo);
						gl.render(scene, camera);
						gl.setRenderTarget(oldRenderTarget);
						gl.autoClear = oldAutoClear;
						gl.xr.enabled = oldXrEnabled;
						gl.xr.isPresenting = oldIsPresenting;
						count++;
					}
				},
				renderPriority,
				this.store,
			);

			onCleanup(() => {
				cleanup();
			});
		});
	}
}

const defaultOptions: NgtsRenderTextureOptions = {
	samples: 8,
	renderPriority: 0,
	eventPriority: 0,
	frames: Infinity,
	stencilBuffer: false,
	depthBuffer: true,
	generateMipmaps: false,
};

/**
 * Structural directive for defining the content to be rendered into the texture.
 * Provides type-safe template context with access to the virtual scene container and injector.
 *
 * @example
 * ```html
 * <ngts-render-texture>
 *   <ng-template renderTextureContent let-container="container">
 *     <ngt-mesh>...</ngt-mesh>
 *   </ng-template>
 * </ngts-render-texture>
 * ```
 */
@Directive({ selector: 'ng-template[renderTextureContent]' })
export class NgtsRenderTextureContent {
	/**
	 * Type guard for template context.
	 *
	 * @param _ - The directive instance
	 * @param ctx - The template context to check
	 * @returns Type predicate for the template context
	 */
	static ngTemplateContextGuard(
		_: NgtsRenderTextureContent,
		ctx: unknown,
	): ctx is { container: THREE.Object3D; injector: Injector } {
		return true;
	}
}

let incrementId = 0;

/**
 * Renders a scene into a texture that can be used as a map on materials.
 * Creates a virtual scene with its own camera and renders it to an offscreen buffer.
 * Supports interactive raycasting through UV coordinate transformation.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-plane-geometry />
 *   <ngt-mesh-standard-material>
 *     <ngts-render-texture attach="map">
 *       <ng-template renderTextureContent>
 *         <ngt-mesh>
 *           <ngt-box-geometry />
 *           <ngt-mesh-basic-material color="red" />
 *         </ngt-mesh>
 *       </ng-template>
 *     </ngts-render-texture>
 *   </ngt-mesh-standard-material>
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-render-texture',
	template: `
		<ngt-portal [container]="virtualScene" [state]="{ events: { compute: compute(), priority: eventPriority() } }">
			<ng-template portalContent let-injector="injector">
				<ng-container
					renderTextureContainer
					[fbo]="fbo"
					[renderPriority]="renderPriority()"
					[frames]="frames()"
					[ngTemplateOutlet]="content()"
					[ngTemplateOutletInjector]="injector"
					[ngTemplateOutletContext]="{ container: virtualScene, injector }"
				>
					<ngt-group (pointerover)="(undefined)" />
				</ng-container>
			</ng-template>
		</ngt-portal>

		<ngt-primitive *args="[fbo.texture]" [attach]="attach()" [parameters]="parameters()" />
	`,
	imports: [NgtPortal, NgtsRenderTextureContainer, NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsRenderTextureImpl {
	/** Property path to attach the texture (e.g., 'map', 'envMap', 'alphaMap'). */
	attach = input<NgtAttachable>('map');
	/** Configuration options for the render texture. */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'samples',
		'renderPriority',
		'eventPriority',
		'frames',
		'stencilBuffer',
		'depthBuffer',
		'generateMipmaps',
		'compute',
		'width',
		'height',
	]);

	content = contentChild.required(NgtsRenderTextureContent, { read: TemplateRef });

	private store = injectStore();

	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private samples = pick(this.options, 'samples');
	private stencilBuffer = pick(this.options, 'stencilBuffer');
	private depthBuffer = pick(this.options, 'depthBuffer');
	private generateMipmaps = pick(this.options, 'generateMipmaps');
	private computeFn = pick(this.options, 'compute');

	private fboParams = computed(() => ({
		width: (this.width() || this.store.size.width()) * this.store.viewport.dpr(),
		height: (this.height() || this.store.size.height()) * this.store.viewport.dpr(),
		settings: {
			samples: this.samples(),
			depthBuffer: this.depthBuffer(),
			stencilBuffer: this.stencilBuffer(),
			generateMipmaps: this.generateMipmaps(),
		},
	}));

	protected renderPriority = pick(this.options, 'renderPriority');
	protected frames = pick(this.options, 'frames');
	protected fbo = fbo(this.fboParams);
	protected virtualScene = (() => {
		const scene = new THREE.Scene();
		scene.name = `ngts-render-texture-virtual-scene-${incrementId++}`;
		return scene;
	})();
	protected eventPriority = pick(this.options, 'eventPriority');
	protected compute = computed(() => this.computeFn() || this.uvCompute);

	private uvCompute: NgtComputeFunction = (event, root, previous) => {
		const fbo = this.fbo;
		if (!fbo) return;
		const state = root.snapshot;
		const previousState = previous?.snapshot;

		// Since this is only a texture it does not have an easy way to obtain the parent, which we
		// need to transform event coordinates to local coordinates. We use ngt internals to find the
		// next Object3D.
		let parent = getInstanceState(fbo.texture)?.parent();
		while (parent && !is.three<THREE.Object3D>(parent, 'isObject3D')) {
			parent = getInstanceState(parent)?.parent();
		}

		if (!parent) return;
		// First we call the previous state-onion-layers compute, this is what makes it possible to nest portals
		if (previousState && !previousState.raycaster.camera) {
			previousState.events.compute?.(event, previous, previous.snapshot.previousRoot);
		}
		// We run a quick check against the parent, if it isn't hit there's no need to raycast at all
		const [intersection] = previousState?.raycaster.intersectObject(parent) || [];
		if (!intersection) return;
		// We take that hits uv coords, set up this layers raycaster, et voilà, we have raycasting on arbitrary surfaces
		const uv = intersection.uv;
		if (!uv) return;
		state.raycaster.setFromCamera(state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1), state.camera);
	};

	constructor() {
		extend({ Group });
	}
}

/**
 * Tuple of components required for the render texture feature.
 * Import this array to use render texture functionality.
 *
 * @example
 * ```typescript
 * @Component({
 *   imports: [NgtsRenderTexture],
 *   // ...
 * })
 * ```
 */
export const NgtsRenderTexture = [NgtsRenderTextureImpl, NgtsRenderTextureContent] as const;
