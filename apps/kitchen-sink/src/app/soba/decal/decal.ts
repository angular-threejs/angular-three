import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [camera]="{ position: [-2.5, 1, 10], fov: 17 }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'decal-soba' },
	imports: [NgtCanvas],
})
export default class Decal {
	protected scene = Experience;
}
