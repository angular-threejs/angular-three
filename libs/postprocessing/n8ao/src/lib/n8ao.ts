// @ts-expect-error - n8ao is not typed
import { N8AOPostPass } from 'n8ao';

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	inject,
	input,
} from '@angular/core';
import { applyProps, NgtArgs, pick } from 'angular-three';
import { NgtpEffectComposer } from 'angular-three-postprocessing';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

/**
 * Configuration options for the N8AO (N8 Ambient Occlusion) effect.
 *
 * N8AO is a high-quality, screen-space ambient occlusion implementation
 * that provides realistic shadowing in crevices and corners.
 */
export interface NgtpN8AOOptions {
	/**
	 * Radius of the ambient occlusion effect in world units.
	 * @default 5.0
	 */
	aoRadius: number;

	/**
	 * Number of tones for AO gradient.
	 * @default 0.0
	 */
	aoTones: number;

	/**
	 * How quickly the AO effect falls off with distance.
	 * @default 1.0
	 */
	distanceFalloff: number;

	/**
	 * Intensity/strength of the ambient occlusion effect.
	 * @default 5
	 */
	intensity: number;

	/**
	 * Bias offset for depth comparison.
	 * @default 0.0
	 */
	biasOffset: number;

	/**
	 * Bias multiplier for depth comparison.
	 * @default 0.0
	 */
	biasMultiplier: number;

	/**
	 * Number of samples for ambient occlusion calculation.
	 * Higher values = better quality but slower.
	 * @default 16
	 */
	aoSamples: number;

	/**
	 * Number of samples for denoising.
	 * @default 8
	 */
	denoiseSamples: number;

	/**
	 * Radius of the denoising filter.
	 * @default 12
	 */
	denoiseRadius: number;

	/**
	 * Color of the ambient occlusion shadows.
	 * @default 'black'
	 */
	color: THREE.ColorRepresentation;

	/**
	 * Whether to render at half resolution for better performance.
	 * @default false
	 */
	halfRes: boolean;

	/**
	 * Whether to use depth-aware upsampling when using half resolution.
	 * @default true
	 */
	depthAwareUpsampling: boolean;

	/**
	 * Whether to use screen-space radius instead of world-space.
	 * @default false
	 */
	screenSpaceRadius: boolean;

	/**
	 * Render mode for debugging and visualization.
	 * 0: Combined, 1: AO only, 2: Normals, 3: Depth, 4: Denoise
	 * @default 0
	 */
	renderMode: 0 | 1 | 2 | 3 | 4;

	/**
	 * Number of iterations for the denoising filter.
	 * @default 2.0
	 */
	denoiseIterations: number;

	/**
	 * Whether to handle transparent objects correctly.
	 * @default false
	 */
	transparencyAware: boolean;

	/**
	 * Whether to apply gamma correction.
	 * @default true
	 */
	gammaCorrection: boolean;

	/**
	 * Whether to use logarithmic depth buffer.
	 * @default false
	 */
	logarithmicDepthBuffer: boolean;

	/**
	 * Whether to multiply the color instead of darkening.
	 * @default true
	 */
	colorMultiply: boolean;

	/**
	 * Whether to accumulate samples over frames for better quality.
	 * @default false
	 */
	accumulate: boolean;

	/**
	 * Quality preset that overrides individual settings.
	 * Options: 'performance', 'low', 'medium', 'high', 'ultra'
	 * @default undefined
	 */
	quality?: 'performance' | 'low' | 'medium' | 'high' | 'ultra';
}

const defaultOptions: NgtpN8AOOptions = {
	aoSamples: 16,
	aoRadius: 5.0,
	aoTones: 0.0,
	denoiseSamples: 8,
	denoiseRadius: 12,
	distanceFalloff: 1.0,
	intensity: 5,
	denoiseIterations: 2.0,
	renderMode: 0,
	biasOffset: 0.0,
	biasMultiplier: 0.0,
	color: 'black',
	gammaCorrection: true,
	logarithmicDepthBuffer: false,
	screenSpaceRadius: false,
	halfRes: false,
	depthAwareUpsampling: true,
	colorMultiply: true,
	transparencyAware: false,
	accumulate: false,
};

/**
 * Angular component that applies N8AO (N8 Ambient Occlusion) to the scene.
 *
 * N8AO is a high-quality screen-space ambient occlusion effect that adds
 * realistic shadowing to crevices, corners, and areas where objects meet.
 * It provides various quality presets and fine-grained control over the
 * AO appearance.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-n8ao [options]="{ intensity: 3, aoRadius: 2 }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Using quality preset -->
 * <ngtp-effect-composer>
 *   <ngtp-n8ao [options]="{ quality: 'high' }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-n8ao',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpN8AO {
	/**
	 * Configuration options for the N8AO effect.
	 * @see NgtpN8AOOptions
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private quality = pick(this.options, 'quality');

	private effectComposer = inject(NgtpEffectComposer);

	/**
	 * The underlying N8AOPostPass instance.
	 * Created with the scene and camera from the effect composer.
	 */
	protected effect = computed(() => {
		const [scene, camera] = [this.effectComposer.scene(), this.effectComposer.camera()];
		return new N8AOPostPass(scene, camera);
	});

	constructor() {
		effect(() => {
			const n8aoEffect = this.effect();
			if (!n8aoEffect) return;

			const { quality: _, ...configurations } = this.options();
			applyProps(n8aoEffect.configuration, configurations);
		});

		effect(() => {
			this.setQualityEffect();
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}

	/**
	 * Applies a quality preset to the effect.
	 * Converts the quality string to title case and calls the effect's setQuality method.
	 */
	private setQualityEffect() {
		const effect = this.effect();
		if (!effect) return;

		const quality = this.quality();
		if (!quality) return;

		const titleCaseQuality = quality.charAt(0).toUpperCase() + quality.slice(1);
		effect.setQuality(titleCaseQuality);
	}
}
