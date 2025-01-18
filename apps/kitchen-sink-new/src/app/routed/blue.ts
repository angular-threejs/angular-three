import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import * as THREE from 'three';

@Component({
	template: `
		<ngt-mesh #mesh>
			<ngt-box-geometry />
			<ngt-mesh-basic-material color="blue" />
		</ngt-mesh>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export default class BlueScene {
	private meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;
		});
	}
}
