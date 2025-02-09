import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ far: 100, near: 1, position: [-25, 20, 25], zoom: 35 }" orthographic shadows>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'monday-morning-cannon cursor-none' },
})
export default class MondayMorning {}
