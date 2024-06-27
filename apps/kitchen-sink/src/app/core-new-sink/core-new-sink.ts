import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-core-new';

@Component({
	selector: 'app-new-scene',
	standalone: true,
	template: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {}

@Component({
	standalone: true,
	template: `
		hi there
		<ngt-canvas [sceneGraph]="scene" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'core-new-sink' },
})
export default class CoreNewSink {
	scene = Scene;
}
