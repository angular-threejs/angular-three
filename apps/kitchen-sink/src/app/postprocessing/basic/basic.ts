import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [camera]="{ position: [0, 0, 10] }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
	host: { class: 'basic-postprocessing' },
})
export default class Basic {
	protected scene = Experience;
}
