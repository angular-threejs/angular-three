import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffect, NgtpEffectBlendMode, provideDefaultEffectOptions } from '../effect';

/**
 * Custom tilt-shift shader based on Evan Wallace's implementation.
 * Provides line-based focus control with customizable blur parameters.
 */
const TiltShiftShader = {
	fragmentShader: /* language=glsl glsl */ `

    // original shader by Evan Wallace

    #define MAX_ITERATIONS 100

    uniform float blur;
    uniform float taper;
    uniform vec2 start;
    uniform vec2 end;
    uniform vec2 direction;
    uniform int samples;

    float random(vec3 scale, float seed) {
        /* use the fragment position for a different seed per-pixel */
        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 color = vec4(0.0);
        float total = 0.0;
        vec2 startPixel = vec2(start.x * resolution.x, start.y * resolution.y);
        vec2 endPixel = vec2(end.x * resolution.x, end.y * resolution.y);
        float f_samples = float(samples);
        float half_samples = f_samples / 2.0;

        // use screen diagonal to normalize blur radii
        float maxScreenDistance = distance(vec2(0.0), resolution); // diagonal distance
        float gradientRadius = taper * (maxScreenDistance);
        float blurRadius = blur * (maxScreenDistance / 16.0);

        /* randomize the lookup values to hide the fixed number of samples */
        float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
        vec2 normal = normalize(vec2(startPixel.y - endPixel.y, endPixel.x - startPixel.x));
        float radius = smoothstep(0.0, 1.0, abs(dot(uv * resolution - startPixel, normal)) / gradientRadius) * blurRadius;

        #pragma unroll_loop_start
        for (int i = 0; i <= MAX_ITERATIONS; i++) {
            if (i >= samples) { break; } // return early if over sample count
            float f_i = float(i);
            float s_i = -half_samples + f_i;
            float percent = (s_i + offset - 0.5) / half_samples;
            float weight = 1.0 - abs(percent);
            vec4 sample_i = texture2D(inputBuffer, uv + normalize(direction) / resolution * percent * radius);
            /* switch to pre-multiplied alpha to correctly blur transparent images */
            sample_i.rgb *= sample_i.a;
            color += sample_i * weight;
            total += weight;
        }
        #pragma unroll_loop_end

        outputColor = color / total;

        /* switch back from pre-multiplied alpha */
        outputColor.rgb /= outputColor.a + 0.00001;
    }
    `,
};

/**
 * A custom tilt-shift effect with line-based focus control.
 *
 * This effect provides a different approach to tilt-shift compared to
 * the standard TiltShiftEffect, allowing you to define a focus line
 * between two screen-space points.
 *
 * @example
 * ```typescript
 * const effect = new TiltShift2Effect({
 *   blur: 0.2,
 *   start: [0.5, 0.3],
 *   end: [0.5, 0.7]
 * });
 * ```
 */
export class TiltShift2Effect extends Effect {
	/**
	 * Creates a new TiltShift2Effect instance.
	 *
	 * @param options - Configuration options
	 * @param options.blendFunction - How to blend with the scene
	 * @param options.blur - Blur intensity [0, 1], can exceed 1 for more blur
	 * @param options.taper - Taper of the focus area [0, 1]
	 * @param options.start - Start point of focus line in screen space [x, y]
	 * @param options.end - End point of focus line in screen space [x, y]
	 * @param options.samples - Number of blur samples
	 * @param options.direction - Direction of the blur
	 */
	constructor({
		blendFunction = BlendFunction.NORMAL,
		blur = 0.15, // [0, 1], can go beyond 1 for extra
		taper = 0.5, // [0, 1], can go beyond 1 for extra
		start = [0.5, 0.0], // [0,1] percentage x,y of screenspace
		end = [0.5, 1.0], // [0,1] percentage x,y of screenspace
		samples = 10.0, // number of blur samples
		direction = [1, 1], // direction of blur
	} = {}) {
		super('TiltShiftEffect', TiltShiftShader.fragmentShader, {
			blendFunction,
			attributes: EffectAttribute.CONVOLUTION,
			uniforms: new Map<string, THREE.Uniform<number | number[]>>([
				['blur', new THREE.Uniform(blur)],
				['taper', new THREE.Uniform(taper)],
				['start', new THREE.Uniform(start)],
				['end', new THREE.Uniform(end)],
				['samples', new THREE.Uniform(samples)],
				['direction', new THREE.Uniform(direction)],
			]),
		});
	}
}

/**
 * Configuration options for the TiltShift2 effect.
 * Derived from TiltShift2Effect constructor parameters.
 */
export type TiltShift2EffectOptions = Partial<NonNullable<ConstructorParameters<typeof TiltShift2Effect>[0]>>;

extend({ TiltShift2Effect });

/**
 * Angular component that applies an alternative tilt-shift effect.
 *
 * This effect uses a line-based focus system where you define start and
 * end points in screen space. The area between these points stays in focus
 * while the rest of the image is blurred.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-tilt-shift2 [options]="{ blur: 0.2, start: [0.5, 0.3], end: [0.5, 0.7] }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @see NgtpTiltShift for the standard tilt-shift implementation
 */
@Component({
	selector: 'ngtp-tilt-shift2',
	template: `
		<ngt-tilt-shift2-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-tilt-shift2-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.NORMAL })],
})
export class NgtpTiltShift2 {
	/**
	 * Configuration options for the tilt-shift effect.
	 * @see TiltShift2EffectOptions
	 */
	options = input({} as Omit<TiltShift2EffectOptions, 'blendFunction'>);

	/** Reference to the host NgtpEffect directive */
	protected effect = inject(NgtpEffect, { host: true });
}
