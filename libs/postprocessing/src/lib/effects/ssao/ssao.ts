import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import { NgtArgs, injectNgtRef, signalStore } from 'angular-three';
import { BlendFunction, SSAOEffect } from 'postprocessing';
import { injectNgtpEffectComposerApi } from '../../effect-composer';

// first two args are camera and texture
export type NgtpSSAOState = NonNullable<ConstructorParameters<typeof SSAOEffect>[2]>;

declare global {
	interface HTMLElementTagNameMap {
		'ngtp-SSAO': NgtpSSAOState;
	}
}

@Component({
	selector: 'ngtp-SSAO',
	standalone: true,
	template: ` <ngt-primitive *args="[effect()]" [ref]="effectRef" /> `,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpSSAO {
	private inputs = signalStore<NgtpSSAOState>({
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
		depthAwareUpsampling: true,
	});

	@Input() effectRef = injectNgtRef<SSAOEffect>();

	@Input({ alias: 'blendFunction' }) set _blendFunction(blendFunction: BlendFunction) {
		this.inputs.set({ blendFunction });
	}

	@Input({ alias: 'distanceScaling' }) set _distanceScaling(distanceScaling: boolean) {
		this.inputs.set({ distanceScaling });
	}

	@Input({ alias: 'depthAwareUpsampling' }) set _depthAwareUpsampling(depthAwareUpsampling: boolean) {
		this.inputs.set({ depthAwareUpsampling });
	}

	@Input({ alias: 'normalDepthBuffer' }) set _normalDepthBuffer(normalDepthBuffer: THREE.Texture) {
		this.inputs.set({ normalDepthBuffer });
	}

	@Input({ alias: 'samples' }) set _samples(samples: number) {
		this.inputs.set({ samples });
	}

	@Input({ alias: 'rings' }) set _rings(rings: number) {
		this.inputs.set({ rings });
	}

	@Input({ alias: 'worldDistanceThreshold' }) set _worldDistanceThreshold(worldDistanceThreshold: number) {
		this.inputs.set({ worldDistanceThreshold });
	}

	@Input({ alias: 'worldDistanceFalloff' }) set _worldDistanceFalloff(worldDistanceFalloff: number) {
		this.inputs.set({ worldDistanceFalloff });
	}

	@Input({ alias: 'worldProximityThreshold' }) set _worldProximityThreshold(worldProximityThreshold: number) {
		this.inputs.set({ worldProximityThreshold });
	}

	@Input({ alias: 'worldProximityFalloff' }) set _worldProximityFalloff(worldProximityFalloff: number) {
		this.inputs.set({ worldProximityFalloff });
	}

	@Input({ alias: 'distanceThreshold' }) set _distanceThreshold(distanceThreshold: number) {
		this.inputs.set({ distanceThreshold });
	}

	@Input({ alias: 'distanceFalloff' }) set _distanceFalloff(distanceFalloff: number) {
		this.inputs.set({ distanceFalloff });
	}

	@Input({ alias: 'rangeThreshold' }) set _rangeThreshold(rangeThreshold: number) {
		this.inputs.set({ rangeThreshold });
	}

	@Input({ alias: 'rangeFalloff' }) set _rangeFalloff(rangeFalloff: number) {
		this.inputs.set({ rangeFalloff });
	}

	@Input({ alias: 'minRadiusScale' }) set _minRadiusScale(minRadiusScale: number) {
		this.inputs.set({ minRadiusScale });
	}

	@Input({ alias: 'luminanceInfluence' }) set _luminanceInfluence(luminanceInfluence: number) {
		this.inputs.set({ luminanceInfluence });
	}

	@Input({ alias: 'radius' }) set _radius(radius: number) {
		this.inputs.set({ radius });
	}

	@Input({ alias: 'intensity' }) set _intensity(intensity: number) {
		this.inputs.set({ intensity });
	}

	@Input({ alias: 'bias' }) set _bias(bias: number) {
		this.inputs.set({ bias });
	}

	@Input({ alias: 'fade' }) set _fade(fade: number) {
		this.inputs.set({ fade });
	}

	@Input({ alias: 'color' }) set _color(color: THREE.Color) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'resolutionScale' }) set _resolutionScale(resolutionScale: number) {
		this.inputs.set({ resolutionScale });
	}

	@Input({ alias: 'resolutionX' }) set _resolutionX(resolutionX: number) {
		this.inputs.set({ resolutionX });
	}

	@Input({ alias: 'resolutionY' }) set _resolutionY(resolutionY: number) {
		this.inputs.set({ resolutionY });
	}

	@Input({ alias: 'width' }) set _width(width: number) {
		this.inputs.set({ width });
	}

	@Input({ alias: 'height' }) set _height(height: number) {
		this.inputs.set({ height });
	}

	private effectComposerApi = injectNgtpEffectComposerApi();

	effect = computed(() => {
		const [state, { camera, normalPass, downSamplingPass, resolutionScale }] = [
			this.inputs.state(),
			this.effectComposerApi(),
		];

		if (normalPass === null && downSamplingPass === null) {
			console.error('Please enable the NormalPass in the NgtpEffectComposer in order to use NgtpSSAO.');
			return null;
		}

		return new SSAOEffect(camera, normalPass && !downSamplingPass ? (normalPass as any).texture : null, {
			...state,
			// @ts-expect-error
			normalDepthBuffer: state.normalDepthBuffer || (downSamplingPass ? downSamplingPass.texture : null),
			resolutionScale: state.resolutionScale || (resolutionScale ?? 1),
			depthAwareUpsampling: state.depthAwareUpsampling ?? true,
		});
	});
}
