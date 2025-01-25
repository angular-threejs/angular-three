import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [0, 0, 10] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, NgtCanvasContent, SceneGraph],
	host: { class: 'basic-postprocessing' },
})
export default class Basic {}
