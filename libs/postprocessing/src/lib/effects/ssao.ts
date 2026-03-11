import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { BlendFunction, SSAOEffect } from 'postprocessing';
import { NgtpEffectComposer } from '../effect-composer';

type SSAOOptions = NonNullable<ConstructorParameters<typeof SSAOEffect>[2]>;

@Component({
	selector: 'ngtp-ssao',
	template: `
		<ngt-primitive *args="[effect()]" [dispose]="null" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpSSAO {
	options = input({} as SSAOOptions);

	private effectComposer = inject(NgtpEffectComposer);

	effect = computed(() => {
		const [normalPass, downSamplingPass] = [
			this.effectComposer.normalPass(),
			this.effectComposer.downSamplingPass(),
		];

		if (normalPass === null && downSamplingPass === null) {
			console.error(
				'[NGT Postprocessing] Please enable the NormalPass in the EffectComposer in order to use SSAO.',
			);
			return null;
		}

		const [camera, options] = [this.effectComposer.camera(), this.options()];

		return new SSAOEffect(camera, normalPass && !downSamplingPass ? (normalPass as any).texture : null, {
			blendFunction: BlendFunction.MULTIPLY,
			samples: 30,
			rings: 4,
			distanceThreshold: 1.0,
			distanceFalloff: 0.0,
			rangeThreshold: 0.5,
			rangeFalloff: 0.1,
			luminanceInfluence: 0.9,
			radius: 20,
			bias: 0.5,
			intensity: 1.0,
			color: undefined,
			// @ts-expect-error - normalDepthBuffer is not in the types but is supported
			normalDepthBuffer: downSamplingPass ? downSamplingPass.texture : null,
			resolutionScale: 1,
			depthAwareUpsampling: true,
			...options,
		});
	});

	constructor() {
		effect((onCleanup) => {
			const ssaoEffect = this.effect();
			if (!ssaoEffect) return;
			onCleanup(() => ssaoEffect.dispose());
		});
	}
}
