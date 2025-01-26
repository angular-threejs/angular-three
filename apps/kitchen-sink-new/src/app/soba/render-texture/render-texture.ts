import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [5, 5, 5], fov: 25 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'fbo-render-texture' },
})
export default class RenderTexture {}
