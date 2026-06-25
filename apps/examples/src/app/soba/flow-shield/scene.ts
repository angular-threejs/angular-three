import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
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
		<app-environment />
		<app-grid-floor />
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

	showGrid = input(false, { transform: booleanAttribute });
}
