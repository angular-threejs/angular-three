import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { Mesh } from 'three';

@Component({
	template: `
		<ngt-mesh #cube>
			<ngt-box-geometry />
			<ngt-mesh-basic-material color="blue" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlueCube {
	cubeRef = viewChild.required<ElementRef<Mesh>>('cube');

	constructor() {
		injectBeforeRender(({ clock }) => {
			this.cubeRef().nativeElement.rotation.x = clock.elapsedTime;
			this.cubeRef().nativeElement.rotation.y = clock.elapsedTime;
		});
	}
}
