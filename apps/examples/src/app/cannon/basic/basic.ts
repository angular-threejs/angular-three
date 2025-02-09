import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';
import { State } from './state';

@Component({
	template: `
		<ngt-canvas [shadows]="true" [camera]="{ position: [0, 0, 15] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<div class="font-mono absolute top-0 right-0 flex gap-4 text-white">
			<button (click)="state.toggleDebugging()">Toggle debugging: {{ state.isDebugging() }}</button>
			<span>|</span>
			<button (click)="state.changeGravity()">Change gravity: {{ state.gravity() }}</button>
		</div>
	`,
	imports: [NgtCanvas, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'basic-cannon ' },
	providers: [State],
})
export default class Basic {
	protected state = inject(State);
}
