import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [gl]="{ antialias: false }" [camera]="{ position: [0, 0, 15], near: 5, far: 20 }">
			<app-instanced-vertex-colors-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
	host: { class: 'instanced-vertex-colors-soba' },
})
export default class InstancedVertexColors {}
