import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-core-new';
import { Experience } from './experience';
import { shape } from './state';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="scene"
			[options]="{ shadows: true, camera: { fov: 50, position: [-1, 1, 2.5] } }"
			(pointerMissed)="onPointerMissed()"
		/>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cube-heap-cannon' },
})
export default class CubeHeap {
	scene = Experience;

	onPointerMissed() {
		shape.update((prev) => (prev === 'box' ? 'sphere' : 'box'));
	}
}
