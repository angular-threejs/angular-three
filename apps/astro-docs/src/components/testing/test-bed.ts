import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	type ElementRef,
	signal,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, NgtCanvas } from 'angular-three';
import type { Mesh } from 'three';
import * as THREE from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-mesh
			#mesh
			[scale]="clicked() ? 1.5 : 1"
			(click)="clicked.set(!clicked())"
			(pointerover)="hovered.set(true)"
			(pointerout)="hovered.set(false)"
		>
			<ngt-box-geometry />
			<ngt-mesh-basic-material [color]="hovered() ? 'hotpink' : 'orange'" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class SceneGraph {
	hovered = signal(false);
	clicked = signal(false);

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += 0.01;
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'test-bed' },
})
export default class TestBed {
	sceneGraph = SceneGraph;
}
