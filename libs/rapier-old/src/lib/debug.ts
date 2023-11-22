import { Component } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef } from 'angular-three-old';
import { BufferAttribute, BufferGeometry, Group, LineBasicMaterial, LineSegments } from 'three';
import { injectNgtrPhysicsApi } from './physics';

extend({ Group, LineSegments, LineBasicMaterial, BufferGeometry });

@Component({
	selector: 'ngtr-debug',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-line-segments [ref]="lineSegmentsRef" [frustumCulled]="false">
				<ngt-line-basic-material color="white" [vertexColors]="true" />
				<ngt-buffer-geometry />
			</ngt-line-segments>
		</ngt-group>
	`,
})
export class NgtrDebug {
	private physicsApi = injectNgtrPhysicsApi();
	private lineSegmentsRef = injectNgtRef<LineSegments>();

	constructor() {
		injectBeforeRender(() => {
			const [lineSegments, worldProxy] = [this.lineSegmentsRef.nativeElement, this.physicsApi.worldProxy()];
			if (!lineSegments || !worldProxy) return;

			const buffers = worldProxy.proxy.debugRender();
			lineSegments.geometry.setAttribute('position', new BufferAttribute(buffers.vertices, 3));
			lineSegments.geometry.setAttribute('color', new BufferAttribute(buffers.colors, 4));
		});
	}
}
