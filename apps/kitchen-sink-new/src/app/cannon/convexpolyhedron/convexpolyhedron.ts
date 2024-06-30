import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-core-new';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [options]="{ shadows: true, camera: { fov: 50, position: [-1, 1, 5] } }" />
		<div class="absolute top-4 left-4 font-mono">* Click to invert gravity</div>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'convex-cannon' },
})
export default class ConvexPolyhydron {
	scene = Experience;
}
