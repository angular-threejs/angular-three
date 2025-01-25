import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { World } from '@dimforge/rapier3d-compat';
import { extend, injectBeforeRender } from 'angular-three';
import * as THREE from 'three';
import { BufferAttribute, Group, LineBasicMaterial, LineSegments } from 'three';

@Component({
	selector: 'ngtr-debug',
	template: `
		<ngt-group>
			<ngt-line-segments #lineSegments [frustumCulled]="false">
				<ngt-line-basic-material color="white" [vertexColors]="true" />
				<ngt-buffer-geometry />
			</ngt-line-segments>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtrDebug {
	world = input.required<World | undefined>();

	private lineSegmentsRef = viewChild.required<ElementRef<THREE.LineSegments>>('lineSegments');

	constructor() {
		extend({ Group, LineSegments, LineBasicMaterial, BufferAttribute });

		injectBeforeRender(() => {
			const [world, lineSegments] = [this.world(), this.lineSegmentsRef().nativeElement];
			if (!world || !lineSegments) return;

			const buffers = world.debugRender();

			lineSegments.geometry.setAttribute('position', new BufferAttribute(buffers.vertices, 3));
			lineSegments.geometry.setAttribute('color', new BufferAttribute(buffers.colors, 4));
		});
	}
}
