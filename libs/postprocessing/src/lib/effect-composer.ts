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
import { beforeRender, extend, getInstanceState, injectStore, pick } from 'angular-three';
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

/**
 * Configuration options for the effect composer.
 */
export interface NgtpEffectComposerOptions {
	/**
	 * Whether the effect composer is enabled.
	 * @default true
	 */
	enabled: boolean;

	/**
	 * Whether to use a depth buffer.
	 * @default undefined
	 */
	depthBuffer?: boolean;

	/**
	 * Whether to enable the normal pass.
	 * Only used for SSGI currently, leave it disabled for everything else unless it's needed.
	 * @default undefined
	 */
	enableNormalPass?: boolean;

	/**
	 * Whether to use a stencil buffer.
	 * @default undefined
	 */
	stencilBuffer?: boolean;

	/**
	 * Whether to auto-clear before rendering.
	 * @default true
	 */
	autoClear: boolean;

	/**
	 * Resolution scale for the effect composer.
	 * @default undefined
	 */
	resolutionScale?: number;

	/**
	 * Number of samples for multisampling anti-aliasing.
	 * Set to 0 to disable multisampling.
	 * @default 8
	 */
	multisampling: number;

	/**
	 * The texture data type for the frame buffer.
	 * @default THREE.HalfFloatType
	 */
	frameBufferType: THREE.TextureDataType;

	/**
	 * The render priority for the effect composer.
	 * Higher values render later.
	 * @default 1
	 */
	renderPriority: number;

	/**
	 * Custom camera to use for rendering effects.
	 * If not provided, uses the default camera from the store.
	 * @default undefined
	 */
	camera?: THREE.Camera;

	/**
	 * Custom scene to use for rendering effects.
	 * If not provided, uses the default scene from the store.
	 * @default undefined
	 */
	scene?: THREE.Scene;
}

const defaultOptions: NgtpEffectComposerOptions = {
	enabled: true,
	renderPriority: 1,
	autoClear: true,
	multisampling: 8,
	frameBufferType: THREE.HalfFloatType,
};

/**
 * Checks if an effect has the convolution attribute.
 *
 * @param effect - The effect to check
 * @returns True if the effect has the convolution attribute
 */
function isConvolution(effect: Effect) {
	return (effect.getAttributes() & EffectAttribute.CONVOLUTION) === EffectAttribute.CONVOLUTION;
}

/**
 * Angular component that manages postprocessing effects for a Three.js scene.
 *
 * The effect composer wraps the postprocessing library's EffectComposer and provides
 * a declarative way to add effects to your scene. Effects are added as children of
 * this component and are automatically composed into an effect pass.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-bloom [options]="{ intensity: 1, luminanceThreshold: 0.9 }" />
 *   <ngtp-vignette [options]="{ darkness: 0.5 }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- With custom options -->
 * <ngtp-effect-composer [options]="{ multisampling: 4, autoClear: false }">
 *   <ngtp-smaa />
 *   <ngtp-tone-mapping />
 * </ngtp-effect-composer>
 * ```
 */
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
	/**
	 * Configuration options for the effect composer.
	 * @see NgtpEffectComposerOptions
	 */
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

	/**
	 * The scene used for rendering effects.
	 * Uses custom scene from options if provided, otherwise uses the store's scene.
	 */
	scene = computed(() => this.options().scene ?? this.store.scene());

	/**
	 * The camera used for rendering effects.
	 * Uses custom camera from options if provided, otherwise uses the store's camera.
	 */
	camera = computed(() => this.options().camera ?? this.store.camera());

	private groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	/**
	 * Computed render priority based on whether the composer is enabled.
	 * Returns 0 when disabled, otherwise returns the configured renderPriority.
	 */
	private priority = computed(() => {
		const enabled = this.enabled();
		if (!enabled) return 0;
		return this.renderPriority();
	});

	/**
	 * Creates and configures the effect composer with render pass, normal pass,
	 * and depth downsampling pass based on options.
	 */
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

	/**
	 * The underlying postprocessing EffectComposer instance.
	 * Can be used to access the composer directly for advanced use cases.
	 */
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
			const [composer, width, height] = [
				this.effectComposer(),
				this.store.size.width(),
				this.store.size.height(),
			];
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

		beforeRender(
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
