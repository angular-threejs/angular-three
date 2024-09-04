import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [camera]="{ position: [0, -12, 16] }" [shadows]="true" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
	host: { class: 'kinematic-cannon' },
})
export default class KinematicCube {
	protected scene = Experience;
}
