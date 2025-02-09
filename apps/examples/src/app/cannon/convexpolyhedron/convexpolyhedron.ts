import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ fov: 50, position: [-1, 1, 5] }" shadows>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<div class="absolute top-4 left-4 font-mono">* Click to invert gravity</div>
	`,
	imports: [NgtCanvas, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'convex-cannon' },
})
export default class ConvexPolyhedron {}
