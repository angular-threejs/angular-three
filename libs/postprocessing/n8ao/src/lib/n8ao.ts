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
import { ColorRepresentation } from 'three';

export interface NgtpN8AOOptions {
	aoRadius: number;
	aoTones: number;
	distanceFalloff: number;
	intensity: number;
	biasOffset: number;
	biasMultiplier: number;
	aoSamples: number;
	denoiseSamples: number;
	denoiseRadius: number;
	color: ColorRepresentation;
	halfRes: boolean;
	depthAwareUpsampling: boolean;
	screenSpaceRadius: boolean;
	renderMode: 0 | 1 | 2 | 3 | 4;
	denoiseIterations: number;
	transparencyAware: boolean;
	gammaCorrection: boolean;
	logarithmicDepthBuffer: boolean;
	colorMultiply: boolean;
	accumulate: boolean;
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

@Component({
	selector: 'ngtp-n8ao',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpN8AO {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private quality = pick(this.options, 'quality');

	private effectComposer = inject(NgtpEffectComposer);

	effect = computed(() => {
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
	}

	private setQualityEffect() {
		const effect = this.effect();
		if (!effect) return;

		const quality = this.quality();
		if (!quality) return;

		const titleCaseQuality = quality.charAt(0).toUpperCase() + quality.slice(1);
		effect.setQuality(titleCaseQuality);
	}
}
