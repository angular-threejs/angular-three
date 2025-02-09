import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'postprocessing-outline' },
	imports: [NgtCanvas, SceneGraph],
})
export default class PostprocessingOutline {}
