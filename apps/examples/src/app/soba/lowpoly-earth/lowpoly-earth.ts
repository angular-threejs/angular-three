import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [5, 0, 0], fov: 50 }">
			<app-lowpoly-earth-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'lowpoly-earth-soba' },
	imports: [NgtCanvas, SceneGraph],
})
export default class LowpolyEarth {}
