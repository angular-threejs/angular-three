import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

/**
 * Shader configuration for the water distortion effect.
 * Creates a rippling, underwater-like distortion.
 */
const WaterShader = {
	fragmentShader: /* language=glsl glsl */ `
  uniform float factor;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 vUv = uv;
    float frequency = 6.0 * factor;
    float amplitude = 0.015 * factor;
    float x = vUv.y * frequency + time * .7;
    float y = vUv.x * frequency + time * .3;
    vUv.x += cos(x+y) * amplitude * cos(y);
    vUv.y += sin(x-y) * amplitude * cos(y);
    vec4 rgba = texture2D(inputBuffer, vUv);
    outputColor = rgba;
  }`,
};

/**
 * A postprocessing effect that simulates an underwater/water distortion.
 *
 * Creates animated rippling distortion that makes the scene appear as if
 * viewed through water or a heat haze.
 *
 * @example
 * ```typescript
 * const effect = new WaterEffect({ factor: 0.5 });
 * ```
 */
export class WaterEffect extends Effect {
	/**
	 * Creates a new WaterEffect instance.
	 *
	 * @param options - Configuration options
	 * @param options.blendFunction - How to blend with the scene
	 * @param options.factor - Intensity of the water effect (0 = no effect)
	 */
	constructor({ blendFunction = BlendFunction.NORMAL, factor = 0 } = {}) {
		super('WaterEffect', WaterShader.fragmentShader, {
			blendFunction,
			attributes: EffectAttribute.CONVOLUTION,
			uniforms: new Map<string, THREE.Uniform<number | number[]>>([['factor', new THREE.Uniform(factor)]]),
		});
	}
}

/**
 * Configuration options for the water effect.
 * Derived from WaterEffect constructor parameters.
 */
export type WaterEffectOptions = Partial<NonNullable<ConstructorParameters<typeof WaterEffect>[0]>>;

/**
 * Angular component that applies a water/ripple distortion effect.
 *
 * This effect creates an animated underwater-like distortion that can
 * simulate viewing through water, heat haze, or a dream-like state.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-water [options]="{ factor: 0.5 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-water',
	template: `
		<ngt-water-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-water-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.NORMAL })],
})
export class NgtpWater {
	/**
	 * Configuration options for the water effect.
	 * @see WaterEffectOptions
	 */
	options = input({} as Omit<WaterEffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });

	constructor() {
		extend({ WaterEffect });
	}
}
