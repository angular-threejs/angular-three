import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgtArgs, extend } from 'angular-three';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import { Uniform } from 'three';
import { NgtpEffect, NgtpEffectBlendMode, NgtpEffectHostDirective, provideDefaultEffectOptions } from '../effect';

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

export class WaterEffect extends Effect {
	constructor({ blendFunction = BlendFunction.NORMAL, factor = 0 } = {}) {
		super('WaterEffect', WaterShader.fragmentShader, {
			blendFunction,
			attributes: EffectAttribute.CONVOLUTION,
			uniforms: new Map<string, Uniform<number | number[]>>([['factor', new Uniform(factor)]]),
		});
	}
}

export type WaterEffectOptions = Partial<NonNullable<ConstructorParameters<typeof WaterEffect>[0]>>;

extend({ WaterEffect });

@Component({
	selector: 'ngtp-water',
	standalone: true,
	template: `
		<ngt-water-effect *args="[options()]" [camera]="effect.camera()">
			<ngtp-effect-blend-mode />
			<ng-content />
		</ngt-water-effect>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtpEffectBlendMode],
	hostDirectives: [NgtpEffectHostDirective],
	providers: [provideDefaultEffectOptions({ blendFunction: BlendFunction.NORMAL })],
})
export class NgtpWater {
	effect = inject(NgtpEffect, { host: true });
	options = input({} as Omit<WaterEffectOptions, 'blendFunction'>);
}
