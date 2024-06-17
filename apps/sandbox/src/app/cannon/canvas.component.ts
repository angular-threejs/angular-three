import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-old';
import { CannonScene } from './scene.component';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [camera]="{ position: [0, 0, 15] }" [shadows]="true" />
	`,
	imports: [NgtCanvas],
	host: { class: 'cannon-canvas' },
})
export class CannonCanvas {
	scene = CannonScene;
}
