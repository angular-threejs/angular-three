import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-old';
import { VaporwareScene } from './scene.component';

@Component({
	standalone: true,
	templateUrl: './canvas.component.html',
	imports: [NgtCanvas],
	host: { class: 'vaporware-canvas' },
})
export class VaporwareCanvas {
	scene = VaporwareScene;
}
