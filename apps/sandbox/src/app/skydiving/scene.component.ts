import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtpBloom, NgtpEffectComposer, NgtpVignette } from 'angular-three-postprocessing-old';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
import { NgtsCameraShake, NgtsEnvironment } from 'angular-three-soba-old/staging';
import { Model } from './components/model.component';
import { WindEffect } from './components/wind-effect.component';
import { World } from './components/world.component';

@Component({
	standalone: true,
	template: `
		<ngts-environment [frames]="1" path="assets/env" [resolution]="256" />

		<app-world />
		<app-wind-effect />
		<app-model />

		<ngts-camera-shake [yawFrequency]="4" [pitchFrequency]="4" [rollFrequency]="5" [intensity]="0.3" />

		<ngt-ambient-light [intensity]="0.2 * Math.PI" />
		<ngt-directional-light [intensity]="2" [position]="[-0.15, -2, 0]" />

		<ngts-orbit-controls [makeDefault]="true" />

		<ngtp-effect-composer>
			<ngtp-bloom [luminanceThreshold]="0.6" [luminanceSmoothing]="0.5" [intensity]="1.2" [mipmapBlur]="true" />
			<ngtp-vignette [offset]="0.5" [darkness]="0.5" />
		</ngtp-effect-composer>
	`,
	imports: [
		NgtsEnvironment,
		NgtsCameraShake,
		NgtsOrbitControls,
		NgtpEffectComposer,
		NgtpBloom,
		NgtpVignette,
		World,
		Model,
		WindEffect,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SkyDivingScene {
	Math = Math;
}
