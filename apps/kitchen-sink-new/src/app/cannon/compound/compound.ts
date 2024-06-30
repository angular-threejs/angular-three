import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-core-new';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [options]="{ shadows: true, camera: { fov: 50, position: [-2, 1, 7] } }" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'compound-cannon' },
})
export default class Compound {
	scene = Experience;
}
