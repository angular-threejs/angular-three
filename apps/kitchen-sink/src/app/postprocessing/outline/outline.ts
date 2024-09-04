import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'postprocessing-outline' },
	imports: [NgtCanvas],
})
export default class PostprocessingOutline {
	protected sceneGraph = Experience;
}
