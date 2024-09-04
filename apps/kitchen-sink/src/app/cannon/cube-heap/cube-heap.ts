import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';
import { shape } from './state';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="scene"
			[shadows]="true"
			[camera]="{ fov: 50, position: [-1, 1, 2.5] }"
			(pointerMissed)="onPointerMissed()"
		/>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cube-heap-cannon' },
})
export default class CubeHeap {
	protected scene = Experience;

	onPointerMissed() {
		shape.update((prev) => (prev === 'box' ? 'sphere' : 'box'));
	}
}
