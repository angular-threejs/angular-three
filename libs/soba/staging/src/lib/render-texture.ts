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
	input,
} from '@angular/core';
import {
	NgtArgs,
	NgtAttachable,
	NgtComputeFunction,
	NgtPortal,
	NgtPortalContent,
	NgtTexture,
	extend,
	getLocalState,
	injectBeforeRender,
	injectStore,
	omit,
	pick,
	prepare,
} from 'angular-three';
import { injectFBO } from 'angular-three-soba/misc';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Group, Object3D, Scene, WebGLRenderTarget } from 'three';

extend({ Group });

export interface NgtsRenderTextureOptions extends Partial<Omit<NgtTexture, 'attach'>> {
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

@Directive({ standalone: true, selector: '[ngtsRenderTextureContainer]' })
export class NgtsRenderTextureContainer {
	fbo = input.required<WebGLRenderTarget>();
	renderPriority = input.required<number>();
	frames = input.required<number>();
	injector = input.required<Injector>();

	private store = injectStore();

	constructor() {
		injectAutoEffect()(() => {
			// track
			this.store.state();
			const renderPriority = this.renderPriority();

			let count = 0;
			let oldAutoClear: boolean;
			let oldXrEnabled: boolean;
			let oldRenderTarget: WebGLRenderTarget | null;
			let oldIsPresenting: boolean;
			const sub = injectBeforeRender(
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
				{ priority: renderPriority, injector: this.injector() },
			);

			return () => sub();
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

@Directive({ selector: 'ng-template[renderTextureContent]', standalone: true })
export class NgtsRenderTextureContent {
	static ngTemplateContextGuard(
		_: NgtsRenderTextureContent,
		ctx: unknown,
	): ctx is { container: Object3D; injector: Injector } {
		return true;
	}
}

let incrementId = 0;

@Component({
	selector: 'ngts-render-texture',
	standalone: true,
	template: `
		<ngt-portal [container]="virtualScene()" [state]="{ events: { compute: compute(), priority: eventPriority() } }">
			<ng-template portalContent let-injector="injector" let-container="container">
				<ng-container
					ngtsRenderTextureContainer
					[fbo]="fbo()"
					[renderPriority]="renderPriority()"
					[frames]="frames()"
					[injector]="injector"
					[ngTemplateOutlet]="content()"
					[ngTemplateOutletInjector]="injector"
					[ngTemplateOutletContext]="{ container, injector }"
				>
					<ngt-group (pointerover)="onPointerOver()" />
				</ng-container>
			</ng-template>
		</ngt-portal>

		<ngt-primitive *args="[fbo().texture]" [attach]="attach()" [parameters]="parameters()" />
	`,
	imports: [NgtPortal, NgtsRenderTextureContainer, NgtPortalContent, NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsRenderTexture {
	attach = input<NgtAttachable>('map');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
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
	private size = this.store.select('size');
	private viewport = this.store.select('viewport');

	private fboParams = computed(() => ({
		width: (this.options().width || this.size().width) * this.viewport().dpr,
		height: (this.options().height || this.size().height) * this.viewport().dpr,
		settings: {
			samples: this.options().samples,
			depthBuffer: this.options().depthBuffer,
			stencilBuffer: this.options().stencilBuffer,
			generateMipmaps: this.options().generateMipmaps,
		},
	}));

	renderPriority = pick(this.options, 'renderPriority');
	frames = pick(this.options, 'frames');
	fbo = injectFBO(this.fboParams);
	virtualScene = computed(() => {
		const scene = prepare(new Scene());
		scene.name = `ngts-render-texture-virtual-scene-${incrementId++}`;
		return scene;
	});
	eventPriority = pick(this.options, 'eventPriority');
	compute = computed(() => this.options().compute || this.uvCompute);

	private uvCompute: NgtComputeFunction = (event, root, previous) => {
		const fbo = this.fbo();
		if (!fbo) return;
		const state = root.snapshot;
		const previousState = previous?.snapshot;

		// Since this is only a texture it does not have an easy way to obtain the parent, which we
		// need to transform event coordinates to local coordinates. We use r3f internals to find the
		// next Object3D.
		let parent = getLocalState(fbo.texture)?.parent();
		while (parent && !(parent instanceof Object3D)) {
			parent = getLocalState(parent)?.parent();
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

	onPointerOver() {
		/* noop */
	}
}
