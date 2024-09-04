import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';
import { State } from './state';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [camera]="{ position: [0, 0, 15] }" />
		<div class="font-mono absolute top-0 right-0 flex gap-4 text-white">
			<button (click)="state.toggleDebugging()">Toggle debugging: {{ state.isDebugging() }}</button>
			<span>|</span>
			<button (click)="state.changeGravity()">Change gravity: {{ state.gravity() }}</button>
		</div>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'basic-cannon ' },
	providers: [State],
})
export default class Basic {
	protected scene = Experience;
	protected state = inject(State);
}
