import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'hud-soba' },
})
export default class RenderTexture {}
