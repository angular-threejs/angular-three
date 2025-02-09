import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ position: [4, 2.5, 8], fov: 35 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'baking-soft-shadows' },
})
export default class BakingSoftShadows {}
