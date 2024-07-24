import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	type ElementRef,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, type NgtVector3 } from 'angular-three';
import type { Mesh } from 'three';

@Component({
	selector: 'app-cube',
	standalone: true,
	template: `
		<ngt-mesh
			#mesh
			[position]="position()"
			[scale]="clicked() ? 1.5 : 1"
			(pointerover)="hovered.set(true)"
			(pointerout)="hovered.set(false)"
			(click)="clicked.set(!clicked())"
		>
			<ngt-box-geometry />
			<ngt-mesh-standard-material [color]="hovered() ? 'darkred' : 'mediumpurple'" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Cube {
	position = input<NgtVector3>([0, 0, 0]);

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

@Component({
	standalone: true,
	template: `
		<ngt-ambient-light [intensity]="0.5" />
		<ngt-spot-light [position]="10" [intensity]="0.5 * Math.PI" [angle]="0.15" [penumbra]="1" [decay]="0" />
		<ngt-point-light [position]="-10" [intensity]="0.5 * Math.PI" [decay]="0" />

		<app-cube [position]="[1.5, 0, 0]" />
		<app-cube [position]="[-1.5, 0, 0]" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Cube],
})
export class SceneGraphStepFive {
	protected readonly Math = Math;
}
