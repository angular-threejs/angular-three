import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ fov: 50, position: [-2, 1, 7] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, NgtCanvasContent, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'compound-cannon' },
})
export default class Compound {}
