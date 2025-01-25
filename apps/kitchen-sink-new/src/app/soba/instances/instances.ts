import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [0, 0, 0.01] }">
			<app-instances-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'instances-soba' },
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
})
export default class Instances {}
