import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, type ElementRef, viewChild } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import type { Mesh } from 'three';

@Component({
	standalone: true,
	template: `
		<ngt-mesh #mesh>
			<ngt-box-geometry />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraphStepTwo {
	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(({ delta }) => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += delta;
			mesh.rotation.y += delta;
		});
	}
}
