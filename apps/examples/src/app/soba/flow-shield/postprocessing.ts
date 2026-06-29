import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtpBloom, NgtpEffectComposer, NgtpNoise } from 'angular-three-postprocessing';
import { FlowShieldState } from './state';

@Component({
	selector: 'app-post-processing',
	template: `
		<ngtp-effect-composer
			[options]="{ multisampling: state.postprocessing.multisampling(), frameBufferType: state.postprocessing.frameBufferType() }"
		>
			<ngtp-bloom
				[options]="{
					intensity: state.postprocessing.bloomIntensity(),
					luminanceThreshold: state.postprocessing.bloomLuminanceThreshold(),
					radius: state.postprocessing.bloomRadius(),
					mipmapBlur: state.postprocessing.bloomMipmapBlur(),
					kernelSize: state.postprocessing.bloomKernelSize(),
				}"
			/>

			<ngtp-noise
				[options]="{ premultiply: state.postprocessing.noisePremultiply() }"
				[opacity]="state.postprocessing.noiseOpacity()"
				[blendFunction]="state.postprocessing.noiseBlendFunction()"
			/>
		</ngtp-effect-composer>
	`,
	imports: [NgtpEffectComposer, NgtpBloom, NgtpNoise],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostProcessing {
	protected state = inject(FlowShieldState);
}
