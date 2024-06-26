import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<!-- <ngt-canvas [sceneGraph]="scene" /> -->
		<app-experience />
	`,
	imports: [NgtCanvas, Experience],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'fbo-soba' },
})
export default class Fbo {
	scene = Experience;
}
