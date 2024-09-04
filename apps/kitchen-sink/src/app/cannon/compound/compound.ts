import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [camera]="{ fov: 50, position: [-2, 1, 7] }" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'compound-cannon' },
})
export default class Compound {
	protected scene = Experience;
}
