import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [gl]="{ antialias: false }" [camera]="{ position: [0, 0, 15], near: 5, far: 20 }">
			<app-instanced-vertex-colors-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'instanced-vertex-colors-soba' },
})
export default class InstancedVertexColors {}
