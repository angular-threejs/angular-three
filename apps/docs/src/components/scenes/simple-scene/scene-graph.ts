import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender } from 'angular-three';
import { BoxGeometry, Mesh, MeshNormalMaterial } from 'three';

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-mesh #mesh [scale]="scale()" (pointerover)="scale.set(1.5)" (pointerout)="scale.set(1)">
			<ngt-box-geometry />
			<ngt-mesh-normal-material />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	private meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	protected scale = signal(1);

	constructor() {
		extend({ Mesh, MeshNormalMaterial, BoxGeometry });

		injectBeforeRender(() => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;
		});
	}
}
