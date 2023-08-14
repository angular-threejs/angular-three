import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	Injector,
	Input,
	computed,
	effect,
	forwardRef,
	inject,
} from '@angular/core';
import {
	createInjectionToken,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	signalStore,
} from 'angular-three';
import {
	DepthDownsamplingPass,
	Effect,
	EffectComposer,
	EffectPass,
	NormalPass,
	Pass,
	RenderPass,
} from 'postprocessing';
import * as THREE from 'three';
import { Group } from 'three';
import { isWebGL2Available } from 'three-stdlib';

extend({ Group });

export type NgtpEffectComposerState = {
	enabled: boolean;
	depthBuffer?: boolean;
	disableNormalPass?: boolean;
	stencilBuffer?: boolean;
	autoClear: boolean;
	resolutionScale?: number;
	multisampling: number;
	frameBufferType: THREE.TextureDataType;
	renderPriority: number;
	camera?: THREE.Camera;
	scene?: THREE.Scene;
};

export const [injectNgtpEffectComposerApi, provideNgtpEffectComposerApi] = createInjectionToken(
	(composer: NgtpEffectComposer) => composer.api,
	{ isRoot: false, deps: [forwardRef(() => NgtpEffectComposer)] },
);

@Component({
	selector: 'ngtp-effect-composer',
	standalone: true,
	template: `
		<ngt-group [ref]="composerRef">
			<ng-content />
		</ngt-group>
	`,
	providers: [provideNgtpEffectComposerApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpEffectComposer {
	private inputs = signalStore<NgtpEffectComposerState>({
		enabled: true,
		renderPriority: 1,
		autoClear: true,
		multisampling: 8,
		frameBufferType: THREE.HalfFloatType,
	});

	@Input() composerRef = injectNgtRef<Group>();

	@Input({ alias: 'enabled' }) set _enabled(enabled: boolean) {
		this.inputs.set({ enabled });
	}

	@Input({ alias: 'depthBuffer' }) set _depthBuffer(depthBuffer: boolean) {
		this.inputs.set({ depthBuffer });
	}

	@Input({ alias: 'disableNormalPass' }) set _disableNormalPass(disableNormalPass: boolean) {
		this.inputs.set({ disableNormalPass });
	}

	@Input({ alias: 'stencilBuffer' }) set _stencilBuffer(stencilBuffer: boolean) {
		this.inputs.set({ stencilBuffer });
	}

	@Input({ alias: 'autoClear' }) set _autoClear(autoClear: boolean) {
		this.inputs.set({ autoClear });
	}

	@Input({ alias: 'resolutionScale' }) set _resolutionScale(resolutionScale: number) {
		this.inputs.set({ resolutionScale });
	}

	@Input({ alias: 'multisampling' }) set _multisampling(multisampling: number) {
		this.inputs.set({ multisampling });
	}

	@Input({ alias: 'frameBufferType' }) set _frameBufferType(frameBufferType: THREE.TextureDataType) {
		this.inputs.set({ frameBufferType });
	}

	@Input({ alias: 'renderPriority' }) set _renderPriority(renderPriority: number) {
		this.inputs.set({ renderPriority });
	}

	@Input({ alias: 'camera' }) set _camera(camera: THREE.Camera) {
		this.inputs.set({ camera });
	}

	@Input({ alias: 'scene' }) set _scene(scene: THREE.Scene) {
		this.inputs.set({ scene });
	}

	private injector = inject(Injector);

	private store = injectNgtStore();
	private gl = this.store.select('gl');
	private defaultScene = this.store.select('scene');
	private defaultCamera = this.store.select('camera');
	private size = this.store.select('size');

	private depthBuffer = this.inputs.select('depthBuffer');
	private stencilBuffer = this.inputs.select('stencilBuffer');
	private multisampling = this.inputs.select('multisampling');
	private frameBufferType = this.inputs.select('frameBufferType');
	private scene = this.inputs.select('scene');
	private camera = this.inputs.select('camera');
	private disableNormalPass = this.inputs.select('disableNormalPass');
	private resolutionScale = this.inputs.select('resolutionScale');
	private autoClear = this.inputs.select('autoClear');

	private activeScene = computed(() => this.scene() || this.defaultScene());
	private activeCamera = computed(() => this.camera() || this.defaultCamera());

	private composerEntities = computed(() => {
		const webGL2Available = isWebGL2Available();
		const [
			gl,
			depthBuffer,
			stencilBuffer,
			multisampling,
			frameBufferType,
			scene,
			camera,
			disableNormalPass,
			resolutionScale,
		] = [
			this.gl(),
			this.depthBuffer(),
			this.stencilBuffer(),
			this.multisampling(),
			this.frameBufferType(),
			this.activeScene(),
			this.activeCamera(),
			this.disableNormalPass(),
			this.resolutionScale(),
		];

		// Initialize composer
		const effectComposer = new EffectComposer(gl, {
			depthBuffer,
			stencilBuffer,
			multisampling: multisampling > 0 && webGL2Available ? multisampling : 0,
			frameBufferType,
		});

		// Add render pass
		effectComposer.addPass(new RenderPass(scene, camera));

		// Create normal pass
		let downSamplingPass = null;
		let normalPass = null;
		if (!disableNormalPass) {
			normalPass = new NormalPass(scene, camera);
			normalPass.enabled = false;
			effectComposer.addPass(normalPass);
			if (resolutionScale !== undefined && webGL2Available) {
				downSamplingPass = new DepthDownsamplingPass({ normalBuffer: normalPass.texture, resolutionScale });
				downSamplingPass.enabled = false;
				effectComposer.addPass(downSamplingPass);
			}
		}

		return { effectComposer, normalPass, downSamplingPass };
	});

	private composer = computed(() => this.composerEntities().effectComposer);

	api = computed(() => {
		const [{ effectComposer: composer, normalPass, downSamplingPass }, resolutionScale, camera, scene] = [
			this.composerEntities(),
			this.resolutionScale(),
			this.activeCamera(),
			this.activeScene(),
		];
		return { composer, normalPass, downSamplingPass, resolutionScale, camera, scene };
	});

	constructor() {
		this.setComposerSize();
		this.updatePasses();
	}

	ngOnInit() {
		this.beforeRender();
	}

	private setComposerSize() {
		effect(() => {
			const [composer, size] = [this.composer(), this.size()];
			composer.setSize(size.width, size.height);
		});
	}

	private updatePasses() {
		effect((onCleanup) => {
			const [{ effectComposer: composer, normalPass, downSamplingPass }, instance, children, camera] = [
				this.composerEntities(),
				this.composerRef.nativeElement,
				this.composerRef.children('nonObjects')(),
				this.activeCamera(),
			];

			const passes: Pass[] = [];

			if (instance && composer && children.length) {
				for (let i = 0; i < children.length; i++) {
					const child = children[i];
					if (child instanceof Effect) {
						const effects: Effect[] = [];

						while (children[i] instanceof Effect) effects.push(children[i++] as Effect);
						i--;

						const pass = new EffectPass(camera, ...effects);
						passes.push(pass);
					} else if (child instanceof Pass) {
						passes.push(child);
					}
				}

				for (const pass of passes) composer.addPass(pass);
				if (normalPass) normalPass.enabled = true;
				if (downSamplingPass) downSamplingPass.enabled = true;
			}

			onCleanup(() => {
				for (const pass of passes) composer?.removePass(pass);
				if (normalPass) normalPass.enabled = false;
				if (downSamplingPass) downSamplingPass.enabled = false;
			});
		});
	}

	private beforeRender() {
		injectBeforeRender(
			({ delta }) => {
				const [enabled, gl, autoClear, stencilBuffer, composer] = [
					this.inputs.get('enabled'),
					this.gl(),
					this.autoClear(),
					this.stencilBuffer(),
					this.composer(),
				];
				if (enabled) {
					const currentAutoClear = gl.autoClear;
					gl.autoClear = autoClear;
					if (stencilBuffer && !autoClear) gl.clearStencil();
					composer.render(delta);
					gl.autoClear = currentAutoClear;
				}
			},
			{
				injector: this.injector,
				priority: this.inputs.get('enabled') ? this.inputs.get('renderPriority') : 0,
			},
		);
	}
}
