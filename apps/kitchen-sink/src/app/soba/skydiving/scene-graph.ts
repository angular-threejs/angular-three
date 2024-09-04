import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { extend } from 'angular-three';
import { NgtpBloom, NgtpEffectComposer, NgtpVignette } from 'angular-three-postprocessing';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsCameraShake, NgtsEnvironment } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { Skydiver } from './skydiver';
import { Winds } from './winds';
import { World } from './world';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngts-environment [options]="{ frames: 1, path: './env/skydiving', resolution: 256 }" />

		<app-world />
		<app-skydiver />
		<app-winds />

		<ngts-camera-shake [options]="{ yawFrequency: 2, pitchFrequency: 2, rollFrequency: 2, intensity: 0.3 }" />

		<ngt-ambient-light [intensity]="0.2 * Math.PI" />
		<ngt-directional-light [intensity]="2 * Math.PI" [position]="[-0.15, -2, 0]" />

		<ngts-orbit-controls [options]="{ makeDefault: true, maxDistance: 5 }" />

		<ngtp-effect-composer>
			<ngtp-bloom [options]="{ luminanceThreshold: 0.6, luminanceSmoothing: 0.5, intensity: 1.2, mipmapBlur: true }" />
			<ngtp-vignette [options]="{ offset: 0.5, darkness: 0.5 }" />
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtsEnvironment,
		NgtsCameraShake,
		NgtsOrbitControls,
		NgtpEffectComposer,
		NgtpBloom,
		NgtpVignette,
		Skydiver,
		World,
		Winds,
	],
})
export class SceneGraph {
	protected readonly Math = Math;
}
