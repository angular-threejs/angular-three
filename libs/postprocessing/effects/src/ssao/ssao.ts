import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, inject } from '@angular/core';
import { NgtArgs, NgtSignalStore, injectNgtRef } from 'angular-three';
import { NGTP_EFFECT_COMPOSER_API } from 'angular-three-postprocessing';
import { BlendFunction, SSAOEffect } from 'postprocessing';

// first two args are camera and texture
export type NgtpSSAOState = NonNullable<ConstructorParameters<typeof SSAOEffect>[2]>;

@Component({
    selector: 'ngtp-SSAO',
    standalone: true,
    template: ` <ngt-primitive *args="[effect()]" [ref]="effectRef" /> `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpSSAO extends NgtSignalStore<NgtpSSAOState> {
    @Input() effectRef = injectNgtRef<SSAOEffect>();

    @Input() set blendFunction(blendFunction: BlendFunction) {
        this.set({ blendFunction });
    }

    @Input() set distanceScaling(distanceScaling: boolean) {
        this.set({ distanceScaling });
    }

    @Input() set depthAwareUpsampling(depthAwareUpsampling: boolean) {
        this.set({ depthAwareUpsampling });
    }

    @Input() set normalDepthBuffer(normalDepthBuffer: THREE.Texture) {
        this.set({ normalDepthBuffer });
    }

    @Input() set samples(samples: number) {
        this.set({ samples });
    }

    @Input() set rings(rings: number) {
        this.set({ rings });
    }

    @Input() set worldDistanceThreshold(worldDistanceThreshold: number) {
        this.set({ worldDistanceThreshold });
    }

    @Input() set worldDistanceFalloff(worldDistanceFalloff: number) {
        this.set({ worldDistanceFalloff });
    }

    @Input() set worldProximityThreshold(worldProximityThreshold: number) {
        this.set({ worldProximityThreshold });
    }

    @Input() set worldProximityFalloff(worldProximityFalloff: number) {
        this.set({ worldProximityFalloff });
    }

    @Input() set distanceThreshold(distanceThreshold: number) {
        this.set({ distanceThreshold });
    }

    @Input() set distanceFalloff(distanceFalloff: number) {
        this.set({ distanceFalloff });
    }

    @Input() set rangeThreshold(rangeThreshold: number) {
        this.set({ rangeThreshold });
    }

    @Input() set rangeFalloff(rangeFalloff: number) {
        this.set({ rangeFalloff });
    }

    @Input() set minRadiusScale(minRadiusScale: number) {
        this.set({ minRadiusScale });
    }

    @Input() set luminanceInfluence(luminanceInfluence: number) {
        this.set({ luminanceInfluence });
    }

    @Input() set radius(radius: number) {
        this.set({ radius });
    }

    @Input() set intensity(intensity: number) {
        this.set({ intensity });
    }

    @Input() set bias(bias: number) {
        this.set({ bias });
    }

    @Input() set fade(fade: number) {
        this.set({ fade });
    }

    @Input() set color(color: THREE.Color) {
        this.set({ color });
    }

    @Input() set resolutionScale(resolutionScale: number) {
        this.set({ resolutionScale });
    }

    @Input() set resolutionX(resolutionX: number) {
        this.set({ resolutionX });
    }

    @Input() set resolutionY(resolutionY: number) {
        this.set({ resolutionY });
    }

    @Input() set width(width: number) {
        this.set({ width });
    }

    @Input() set height(height: number) {
        this.set({ height });
    }

    readonly #effectComposerApi = inject(NGTP_EFFECT_COMPOSER_API);

    readonly effect = computed(() => {
        const state = this.state();
        const { camera, normalPass, downSamplingPass, resolutionScale } = this.#effectComposerApi();

        if (normalPass === null && downSamplingPass === null) {
            console.error('Please enable the NormalPass in the NgtpEffectComposer in order to use NgtpSSAO.');
            return {};
        }

        return new SSAOEffect(camera, normalPass && !downSamplingPass ? (normalPass as any).texture : null, {
            ...state,
            // @ts-expect-error
            normalDepthBuffer: state.normalDepthBuffer || (downSamplingPass ? downSamplingPass.texture : null),
            resolutionScale: state.resolutionScale || (resolutionScale ?? 1),
            depthAwareUpsampling: state.depthAwareUpsampling ?? true,
        });
    });

    constructor() {
        super({
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
    }
}
