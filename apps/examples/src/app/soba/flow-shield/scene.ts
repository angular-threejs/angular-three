import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NgtsEnvironmentPresets } from 'angular-three-soba/staging';
import { Camera } from './camera';
import { Environment } from './environment';
import { ForceShield } from './force-shield';
import { GridFloor } from './grid-floor';
import { Lighting } from './lighting';
import { PostProcessing } from './postprocessing';

@Component({
	selector: 'app-flow-shield-scene-graph',
	template: `
		<app-camera />
		<app-lighting />
		<app-environment [preset]="preset()" />

		@if (showGrid()) {
			<app-grid-floor />
		}

		<app-force-shield />
		<app-post-processing />
	`,
	imports: [GridFloor, Lighting, Camera, Environment, PostProcessing, ForceShield],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'soba-experience' },
})
export class SceneGraph {
	protected Math = Math;

	showGrid = input(true);
	preset = input.required<NgtsEnvironmentPresets>();
}
