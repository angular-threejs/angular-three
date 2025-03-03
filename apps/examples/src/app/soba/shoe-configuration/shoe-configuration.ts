import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { ColorPicker, SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ position: [0, 0, 4], fov: 45 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<app-color-picker />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'soba-shoe-configuration' },
	imports: [NgtCanvas, SceneGraph, ColorPicker],
})
export default class ShoeConfiguration {}
