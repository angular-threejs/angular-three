import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtpBloom, NgtpEffectComposer, NgtpNoise } from 'angular-three-postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';

@Component({
	selector: 'app-post-processing',
	template: `
		<ngtp-effect-composer [options]="{ multisampling: 0, frameBufferType: HalfFloatType }">
			<ngtp-bloom
				[options]="{
					intensity: 1.6,
					luminanceThreshold: 0.1,
					radius: 0.56,
					mipmapBlur: true,
					kernelSize: KernelSize.LARGE,
				}"
			/>

			<ngtp-noise [options]="{ premultiply: false }" [opacity]="0.17" [blendFunction]="BlendFunction.OVERLAY" />
		</ngtp-effect-composer>
	`,
	imports: [NgtpEffectComposer, NgtpBloom, NgtpNoise],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostProcessing {
	protected readonly HalfFloatType = THREE.HalfFloatType;
	protected readonly KernelSize = KernelSize;
	protected readonly BlendFunction = BlendFunction;
}
