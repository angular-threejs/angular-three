import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ fov: 45, position: [-20, 40, 30], near: 1, far: 300 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<code class="absolute top-2 left-2 text-black">double click to zoom in/out</code>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
})
export default class PortalShapes {}
