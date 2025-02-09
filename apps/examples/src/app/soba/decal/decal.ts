import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ position: [-2.5, 1, 10], fov: 17 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'decal-soba' },
	imports: [NgtCanvas, SceneGraph],
})
export default class Decal {}
