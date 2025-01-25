import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';
import { shape } from './state';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ fov: 50, position: [-1, 1, 2.5] }" (pointerMissed)="onPointerMissed()">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, NgtCanvasContent, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cube-heap-cannon' },
})
export default class CubeHeap {
	protected scene = SceneGraph;

	onPointerMissed() {
		shape.update((prev) => (prev === 'box' ? 'sphere' : 'box'));
	}
}
