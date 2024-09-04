import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [camera]="{ fov: 50, position: [0, 5, 20] }" />
		<div class="absolute bottom-4 right-4 font-mono text-white">* Click to reset</div>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'chain-cannon' },
})
export default class Chain {
	protected scene = Experience;
}
