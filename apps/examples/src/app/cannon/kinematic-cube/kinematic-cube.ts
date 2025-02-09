import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [0, -12, 16] }" shadows>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'kinematic-cannon' },
})
export default class KinematicCube {}
