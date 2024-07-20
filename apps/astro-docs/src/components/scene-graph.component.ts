import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { extend, injectBeforeRender } from 'angular-three';
import * as THREE from 'three';

extend(THREE);

@Component({
	selector: 'scene-graph',
	standalone: true,
	template: `
		<ngt-mesh #mesh>
			<ngt-box-geometry />
			<ngt-mesh-basic-material color="hotpink" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {
	mesh = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			this.mesh().nativeElement.rotation.x += 0.01;
		});
	}
}
