import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { VaporwareScene } from './scene.component';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="scene"
			[camera]="{ near: 0.01, far: 20, position: [0, 0.06, 1.1] }"
			[gl]="{ useLegacyLights: true }"
			[shadows]="true"
		/>
	`,
	imports: [NgtCanvas],
	host: { class: 'vaporware-canvas' },
})
export class VaporwareCanvas {
	scene = VaporwareScene;
}
