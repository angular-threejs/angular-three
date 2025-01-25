import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ fov: 50, position: [0, 5, 20] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<div class="absolute bottom-4 right-4 font-mono text-white">* Click to reset</div>
	`,
	imports: [NgtCanvas, NgtCanvasContent, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'chain-cannon' },
})
export default class Chain {}
