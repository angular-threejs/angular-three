import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	effect,
	input,
	viewChild,
} from '@angular/core';
import { extend, getInstanceState, injectBeforeRender, injectStore, pick } from 'angular-three';
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
import * as THREE from 'three';
import { Group } from 'three';
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
	frameBufferType: THREE.TextureDataType;
	renderPriority: number;
	camera?: THREE.Camera;
	scene?: THREE.Scene;
}

const defaultOptions: NgtpEffectComposerOptions = {
	enabled: true,
	renderPriority: 1,
	autoClear: true,
	multisampling: 8,
	frameBufferType: THREE.HalfFloatType,
};

function isConvolution(effect: Effect) {
	return (effect.getAttributes() & EffectAttribute.CONVOLUTION) === EffectAttribute.CONVOLUTION;
}

@Component({
	selector: 'ngtp-effect-composer',
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

	private store = injectStore();

	private depthBuffer = pick(this.options, 'depthBuffer');
	private stencilBuffer = pick(this.options, 'stencilBuffer');
	private multisampling = pick(this.options, 'multisampling');
	private frameBufferType = pick(this.options, 'frameBufferType');
	private enableNormalPass = pick(this.options, 'enableNormalPass');
	private resolutionScale = pick(this.options, 'resolutionScale');
	private enabled = pick(this.options, 'enabled');
	private renderPriority = pick(this.options, 'renderPriority');

	scene = computed(() => this.options().scene ?? this.store.scene());
	camera = computed(() => this.options().camera ?? this.store.camera());

	private groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private priority = computed(() => {
		const enabled = this.enabled();
		if (!enabled) return 0;
		return this.renderPriority();
	});

	private composerData = computed(() => {
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
			this.store.gl(),
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

	effectComposer = pick(this.composerData, 'composer');

	constructor() {
		extend({ Group });

		// NOTE: Disable tone mapping because threejs disallows tonemapping on render targets
		effect((onCleanup) => {
			const gl = this.store.gl();
			const currentTonemapping = gl.toneMapping;
			gl.toneMapping = THREE.NoToneMapping;
			onCleanup(() => {
				gl.toneMapping = currentTonemapping;
			});
		});

		effect(() => {
			const [composer, width, height] = [this.effectComposer(), this.store.size.width(), this.store.size.height()];
			if (composer) {
				composer.setSize(width, height);
			}
		});

		effect((onCleanup) => {
			const [group, { composer, normalPass, downSamplingPass }, camera] = [
				this.groupRef().nativeElement,
				this.composerData(),
				this.camera(),
			];

			const passes: Pass[] = [];

			if (composer) {
				const instanceState = getInstanceState(group);
				if (!instanceState) return;

				const children = instanceState.nonObjects();
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

			onCleanup(() => {
				for (const pass of passes) composer?.removePass(pass);
				if (normalPass) normalPass.enabled = false;
				if (downSamplingPass) downSamplingPass.enabled = false;
			});
		});

		injectBeforeRender(
			({ delta }) => {
				const [composer, { enabled, autoClear, stencilBuffer }, gl] = [
					this.effectComposer(),
					this.options(),
					this.store.snapshot.gl,
				];

				if (enabled) {
					const currentAutoClear = gl.autoClear;
					gl.autoClear = autoClear;
					if (stencilBuffer && !autoClear) gl.clearStencil();
					composer.render(delta);
					gl.autoClear = currentAutoClear;
				}
			},
			{ priority: this.priority },
		);
	}
}
