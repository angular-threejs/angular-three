import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Injector,
	afterNextRender,
	computed,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { extend, getLocalState, injectBeforeRender, injectStore, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	DepthDownsamplingPass,
	Effect,
	EffectAttribute,
	EffectComposer,
	EffectPass,
	NormalPass,
	Pass,
	RenderPass,
} from 'postprocessing';
import { Camera, Group, HalfFloatType, NoToneMapping, Scene, TextureDataType } from 'three';
import { isWebGL2Available } from 'three-stdlib';

export interface NgtpEffectComposerOptions {
	enabled: boolean;
	depthBuffer?: boolean;
	/** Only used for SSGI currently, leave it disabled for everything else unless it's needed */
	enableNormalPass?: boolean;
	stencilBuffer?: boolean;
	autoClear: boolean;
	resolutionScale?: number;
	multisampling: number;
	frameBufferType: TextureDataType;
	renderPriority: number;
	camera?: Camera;
	scene?: Scene;
}

const defaultOptions: NgtpEffectComposerOptions = {
	enabled: true,
	renderPriority: 1,
	autoClear: true,
	multisampling: 8,
	frameBufferType: HalfFloatType,
};

function isConvolution(effect: Effect) {
	return (effect.getAttributes() & EffectAttribute.CONVOLUTION) === EffectAttribute.CONVOLUTION;
}

@Component({
	selector: 'ngtp-effect-composer',
	standalone: true,
	template: `
		<ngt-group #group>
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpEffectComposer {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private injector = inject(Injector);
	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private size = this.store.select('size');
	private gl = this.store.select('gl');
	private defaultScene = this.store.select('scene');
	private defaultCamera = this.store.select('camera');

	depthBuffer = pick(this.options, 'depthBuffer');
	stencilBuffer = pick(this.options, 'stencilBuffer');
	multisampling = pick(this.options, 'multisampling');
	frameBufferType = pick(this.options, 'frameBufferType');
	scene = computed(() => this.options().scene ?? this.defaultScene());
	camera = computed(() => this.options().camera ?? this.defaultCamera());
	enableNormalPass = pick(this.options, 'enableNormalPass');
	resolutionScale = pick(this.options, 'resolutionScale');

	groupRef = viewChild.required<ElementRef<Group>>('group');

	composerData = computed(() => {
		const webGL2Available = isWebGL2Available();
		const [
			gl,
			scene,
			camera,
			depthBuffer,
			stencilBuffer,
			multisampling,
			frameBufferType,
			enableNormalPass,
			resolutionScale,
		] = [
			this.gl(),
			this.scene(),
			this.camera(),
			this.depthBuffer(),
			this.stencilBuffer(),
			this.multisampling(),
			this.frameBufferType(),
			this.enableNormalPass(),
			this.resolutionScale(),
		];

		// initialize composer
		const composer = new EffectComposer(gl, {
			depthBuffer,
			stencilBuffer,
			multisampling: multisampling > 0 && webGL2Available ? multisampling : 0,
			frameBufferType,
		});

		// add render pass
		composer.addPass(new RenderPass(scene, camera));

		// create normal pass
		let downSamplingPass = null;
		let normalPass = null;
		if (enableNormalPass) {
			normalPass = new NormalPass(scene, camera);
			normalPass.enabled = false;
			composer.addPass(normalPass);
			if (resolutionScale !== undefined && webGL2Available) {
				downSamplingPass = new DepthDownsamplingPass({ normalBuffer: normalPass.texture, resolutionScale });
				downSamplingPass.enabled = false;
				composer.addPass(downSamplingPass);
			}
		}

		return { composer, normalPass, downSamplingPass };
	});

	constructor() {
		extend({ Group });

		afterNextRender(() => {
			this.disableToneMapping();
			this.setComposerSize();
			this.updatePasses();

			injectBeforeRender(
				({ delta }) => {
					const [{ composer }, { enabled, autoClear, stencilBuffer }, gl] = [
						this.composerData(),
						this.options(),
						this.gl(),
					];

					if (enabled) {
						const currentAutoClear = gl.autoClear;
						gl.autoClear = autoClear;
						if (stencilBuffer && !autoClear) gl.clearStencil();
						composer.render(delta);
						gl.autoClear = currentAutoClear;
					}
				},
				{ injector: this.injector, priority: this.options().enabled ? this.options().renderPriority : 0 },
			);
		});
	}

	// NOTE: Disable tone mapping because threejs disallows tonemapping on render targets
	private disableToneMapping() {
		this.autoEffect(() => {
			const gl = this.gl();
			const currentTonemapping = gl.toneMapping;
			gl.toneMapping = NoToneMapping;
			return () => {
				gl.toneMapping = currentTonemapping;
			};
		});
	}

	private setComposerSize() {
		this.autoEffect(() => {
			const [{ composer }, { width, height }] = [this.composerData(), this.size()];
			if (composer) {
				composer.setSize(width, height);
			}
		});
	}

	private updatePasses() {
		this.autoEffect(() => {
			const [group, { composer, normalPass, downSamplingPass }, camera] = [
				this.groupRef(),
				this.composerData(),
				this.camera(),
			];

			const passes: Pass[] = [];

			if (group.nativeElement && composer) {
				const localState = getLocalState(group.nativeElement);
				if (!localState) return;

				const children = localState.nonObjects();
				for (let i = 0; i < children.length; i++) {
					const child = children[i];
					if (child instanceof Effect) {
						const effects: Effect[] = [child];

						if (!isConvolution(child)) {
							let next: unknown = null;
							while ((next = children[i + 1]) instanceof Effect) {
								if (isConvolution(next)) break;
								effects.push(next as Effect);
								i++;
							}
						}

						const pass = new EffectPass(camera, ...effects);
						passes.push(pass);
					} else if (child instanceof Pass) {
						passes.push(child);
					}
				}

				for (const pass of passes) {
					composer.addPass(pass);
				}

				if (normalPass) normalPass.enabled = true;
				if (downSamplingPass) downSamplingPass.enabled = true;
			}

			return () => {
				for (const pass of passes) composer?.removePass(pass);
				if (normalPass) normalPass.enabled = false;
				if (downSamplingPass) downSamplingPass.enabled = false;
			};
		});
	}
}
