import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { beforeRender, extend } from 'angular-three';
import * as THREE from 'three';
import { Group, LineBasicMaterial, LineSegments } from 'three';
import { NgtrPhysics } from './physics';

@Component({
	selector: 'ngtr-debug',
	template: `
		<ngt-group>
			<ngt-line-segments #lineSegments [frustumCulled]="false">
				<ngt-line-basic-material color="white" vertexColors />
				<ngt-buffer-geometry />
			</ngt-line-segments>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtrDebug {
	private physics = inject(NgtrPhysics);
	private lineSegmentsRef = viewChild.required<ElementRef<THREE.LineSegments>>('lineSegments');

	constructor() {
		extend({ Group, LineSegments, LineBasicMaterial });

		beforeRender(() => {
			const worldSingleton = this.physics.worldSingleton();
			if (!worldSingleton) return;

			const lineSegments = this.lineSegmentsRef().nativeElement;
			if (!lineSegments) return;

			const buffers = worldSingleton.proxy.debugRender();
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(buffers.vertices, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(buffers.colors, 4));

			lineSegments.geometry.dispose();
			lineSegments.geometry = geometry;
		});
	}
}
