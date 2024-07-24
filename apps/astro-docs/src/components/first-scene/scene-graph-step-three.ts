import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	type ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import type { Mesh } from 'three';

@Component({
	standalone: true,
	template: `
		<ngt-mesh
			#mesh
			[scale]="clicked() ? 1.5 : 1"
			(pointerover)="hovered.set(true)"
			(pointerout)="hovered.set(false)"
			(click)="clicked.set(!clicked())"
		>
			<ngt-box-geometry />
			<ngt-mesh-basic-material [color]="hovered() ? 'darkred' : 'mediumpurple'" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraphStepThree {
	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	hovered = signal(false);
	clicked = signal(false);

	constructor() {
		injectBeforeRender(({ delta }) => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += delta;
			mesh.rotation.y += delta;
		});
	}
}
