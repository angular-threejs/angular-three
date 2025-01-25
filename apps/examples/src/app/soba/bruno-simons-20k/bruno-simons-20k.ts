import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { ToggleButton } from '../../toggle-button';
import { debug, SceneGraph, withN8ao } from './scene';

@Component({
	template: `
		<ngt-canvas
			flat
			shadows
			[gl]="{ antialias: false }"
			[camera]="{ position: [-30, 35, -15], near: 30, far: 55, fov: 12 }"
		>
			<app-bruno-scene-graph *canvasContent />
		</ngt-canvas>

		<div class="absolute top-10 right-2 flex gap-2 items-center">
			<button [(toggleButton)]="debug">Toggle debug</button>
			<button [(toggleButton)]="withN8ao">Toggle N8ao</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'bruno-simons-2k-soba' },
	imports: [NgtCanvas, NgtCanvasContent, ToggleButton, SceneGraph],
})
export default class BrunoSimons20k {
	protected debug = debug;
	protected withN8ao = withN8ao;
}
