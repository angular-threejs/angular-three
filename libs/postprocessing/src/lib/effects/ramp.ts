import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { Effect } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffect, NgtpEffectBlendMode } from '../effect';

const RampShader = {
	fragmentShader: /* language=glsl glsl */ `
    uniform int rampType;

    uniform vec2 rampStart;
    uniform vec2 rampEnd;

    uniform vec4 startColor;
    uniform vec4 endColor;

    uniform float rampBias;
    uniform float rampGain;

    uniform bool rampMask;
    uniform bool rampInvert;

    float getBias(float time, float bias) {
      return time / (((1.0 / bias) - 2.0) * (1.0 - time) + 1.0);
    }

    float getGain(float time, float gain) {
      if (time < 0.5)
        return getBias(time * 2.0, gain) / 2.0;
      else
        return getBias(time * 2.0 - 1.0, 1.0 - gain) / 2.0 + 0.5;
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 centerPixel = uv * resolution;
      vec2 startPixel = rampStart * resolution;
      vec2 endPixel = rampEnd * resolution;

      float rampAlpha;

      if (rampType == 1) {
        vec2 fuv = centerPixel / resolution.y;
        vec2 suv = startPixel / resolution.y;
        vec2 euv = endPixel / resolution.y;

        float radius = length(suv - euv);
        float falloff = length(fuv - suv);
        rampAlpha = smoothstep(0.0, radius, falloff);
      } else {
        float radius = length(startPixel - endPixel);
        vec2 direction = normalize(vec2(endPixel.x - startPixel.x, -(startPixel.y - endPixel.y)));

        float fade = dot(centerPixel - startPixel, direction);
        if (rampType == 2) fade = abs(fade);

        rampAlpha = smoothstep(0.0, 1.0, fade / radius);
      }

      rampAlpha = abs((rampInvert ? 1.0 : 0.0) - getBias(rampAlpha, rampBias) * getGain(rampAlpha, rampGain));

      if (rampMask) {
        vec4 inputBuff = texture2D(inputBuffer, uv);
        outputColor = mix(inputBuff, inputColor, rampAlpha);
      } else {
        outputColor = mix(startColor, endColor, rampAlpha);
      }
    }
  `,
};

export enum RampType {
	Linear,
	Radial,
	MirroredLinear,
}

export class RampEffect extends Effect {
	constructor({
		rampType = RampType.Linear,
		rampStart = [0.5, 0.5],
		rampEnd = [1, 1],
		startColor = [0, 0, 0, 1],
		endColor = [1, 1, 1, 1],
		rampBias = 0.5,
		rampGain = 0.5,
		rampMask = false,
		rampInvert = false,
		...params
	} = {}) {
		super('RampEffect', RampShader.fragmentShader, {
			...params,
			uniforms: new Map<string, THREE.Uniform>([
				['rampType', new THREE.Uniform(rampType)],
				['rampStart', new THREE.Uniform(rampStart)],
				['rampEnd', new THREE.Uniform(rampEnd)],
				['startColor', new THREE.Uniform(startColor)],
				['endColor', new THREE.Uniform(endColor)],
				['rampBias', new THREE.Uniform(rampBias)],
				['rampGain', new THREE.Uniform(rampGain)],
				['rampMask', new THREE.Uniform(rampMask)],
				['rampInvert', new THREE.Uniform(rampInvert)],
			]),
		});
	}
}

export type RampEffectOptions = Partial<NonNullable<ConstructorParameters<typeof RampEffect>[0]>>;

extend({ RampEffect });

@Component({
	selector: 'ngtp-ramp',
	template: `
		<ngt-ramp-effect #effect *args="[options()]" [camera]="hostEffect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-ramp-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [{ directive: NgtpEffect, inputs: ['blendFunction', 'opacity'] }],
})
export class NgtpRamp {
	options = input({} as Omit<RampEffectOptions, 'blendFunction'>);

	protected hostEffect = inject(NgtpEffect, { host: true });

	effectRef = viewChild<ElementRef<RampEffect>>('effect');
}
