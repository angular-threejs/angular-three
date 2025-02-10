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
import { injectFBO } from 'angular-three-soba/misc';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';

export interface NgtsRenderTextureOptions extends Partial<Omit<NgtThreeElements['ngt-texture'], 'attach'>> {
	/** Optional width of the texture, defaults to viewport bounds */
	width?: number;
	/** Optional height of the texture, defaults to viewport bounds */
	height?: number;
	/** Optional fbo samples */
	samples: number;
	/** Optional stencil buffer, defaults to false */
	stencilBuffer: boolean;
	/** Optional depth buffer, defaults to true */
	depthBuffer: boolean;
	/** Optional generate mipmaps, defaults to false */
	generateMipmaps: boolean;
	/** Optional render priority, defaults to 0 */
	renderPriority: number;
	/** Optional event priority, defaults to 0 */
	eventPriority: number;
	/** Optional frame count, defaults to Infinity. If you set it to 1, it would only render a single frame, etc */
	frames: number;
	/** Optional event compute, defaults to undefined */
	compute?: (event: any, state: any, previous: any) => false | undefined;
}

@Directive({ selector: '[renderTextureContainer]' })
export class NgtsRenderTextureContainer {
	fbo = input.required<THREE.WebGLRenderTarget>();
	renderPriority = input.required<number>();
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

@Directive({ selector: 'ng-template[renderTextureContent]' })
export class NgtsRenderTextureContent {
	static ngTemplateContextGuard(
		_: NgtsRenderTextureContent,
		ctx: unknown,
	): ctx is { container: THREE.Object3D; injector: Injector } {
		return true;
	}
}

let incrementId = 0;

@Component({
	selector: 'ngts-render-texture',
	template: `
		<ngt-portal [container]="virtualScene" [state]="{ events: { compute: compute(), priority: eventPriority() } }">
			<ng-template portalContent let-injector="injector">
				<ng-container
					renderTextureContainer
					[fbo]="fbo()"
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

		<ngt-primitive *args="[fbo().texture]" [attach]="attach()" [parameters]="parameters()" />
	`,
	imports: [NgtPortal, NgtsRenderTextureContainer, NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsRenderTextureImpl {
	attach = input<NgtAttachable>('map');
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
	protected fbo = injectFBO(this.fboParams);
	protected virtualScene = (() => {
		const scene = new THREE.Scene();
		scene.name = `ngts-render-texture-virtual-scene-${incrementId++}`;
		return scene;
	})();
	protected eventPriority = pick(this.options, 'eventPriority');
	protected compute = computed(() => this.computeFn() || this.uvCompute);

	private uvCompute: NgtComputeFunction = (event, root, previous) => {
		const fbo = this.fbo();
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

export const NgtsRenderTexture = [NgtsRenderTextureImpl, NgtsRenderTextureContent] as const;
