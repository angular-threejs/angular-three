import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ position: [5, 0, 0], fov: 50 }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'lowpoly-earth-soba' },
	imports: [NgtCanvas],
})
export default class LowpolyEarth {
	protected sceneGraph = Experience;
}
