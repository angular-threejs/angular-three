import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas
			[camera]="{ fov: 50, near: 0.1, far: 200, position: [8, 5, 8] }"
			[gl]="{ antialias: true, alpha: false }"
			[dpr]="[1, 1.5]"
			shadows
			style="background: #0e0d0c"
		>
			<app-flow-shield-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'flow-shield-soba' },
})
export default class FlowShield {}
