import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Camera } from './camera';
import { Environment } from './environment';
import { ForceShield } from './force-shield';
import { GridFloor } from './grid-floor';
import { Lighting } from './lighting';
import { PostProcessing } from './postprocessing';
import { FlowShieldState } from './state';

@Component({
	selector: 'app-flow-shield-scene-graph',
	template: `
		<app-camera />
		<app-lighting />
		<app-environment />

		@if (state.grid.show()) {
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
	protected state = inject(FlowShieldState);
}
