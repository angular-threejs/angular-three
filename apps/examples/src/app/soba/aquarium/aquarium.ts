import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ position: [30, 0, -3], fov: 35, near: 1, far: 50 }" [gl]="{ stencil: true }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'aquarium' },
	imports: [NgtCanvas, SceneGraph],
})
export default class Aquarium {}
