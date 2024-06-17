import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';
import { State } from './state';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [camera]="{ position: [0, 0, 15] }" />
		<div style="position: absolute; top: 0; right: 0; display: flex; font-family: monospace">
			<button (click)="state.toggleDebugging()">Toggle debugging: {{ state.isDebugging() }}</button>
			<button (click)="state.changeGravity()">Change gravity: {{ state.gravity() }}</button>
		</div>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'basic-cannon' },
	styles: `
		:host {
			display: block;
			height: 100dvh;
		}
	`,
	providers: [State],
})
export default class Basic {
	scene = Experience;

	state = inject(State);
}
