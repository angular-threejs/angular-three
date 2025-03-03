import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows orthographic [camera]="{ position: [10, 20, 20], zoom: 50 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'epoxy-resin-soba-experience' },
	imports: [NgtCanvas, SceneGraph],
})
export default class EpoxyResin {}
