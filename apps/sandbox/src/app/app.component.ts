import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, signal } from '@angular/core';
import { NgtArgs, NgtCanvas, extend, injectBeforeRender, injectNgtRef } from 'angular-three';
import * as THREE from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-spot-light #spotLight [position]="2" [intensity]="10" />
		<ngt-spot-light-helper *args="[spotLight, 'blue']" />

		<ngt-point-light #pointLight [position]="-2" [intensity]="10" />
		<ngt-point-light-helper *args="[pointLight, 1, 'green']" />

		<ngt-mesh
			(click)="active.set(!active())"
			(pointerover)="hover.set(true)"
			(pointerout)="hover.set(false)"
			[ref]="boxRef"
			[scale]="active() ? 1.5 : 1"
		>
			<ngt-box-geometry />
			<ngt-mesh-standard-material [color]="hover() ? 'hotpink' : 'orange'" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	boxRef = injectNgtRef<THREE.Mesh>();

	active = signal(false);
	hover = signal(false);

	constructor() {
		injectBeforeRender(() => {
			this.boxRef.nativeElement.rotation.x += 0.01;
			this.boxRef.nativeElement.rotation.y += 0.01;
		});
	}
}

@Component({
	standalone: true,
	imports: [NgtCanvas, NgIf],
	selector: 'sandbox-root',
	template: ` <ngt-canvas [sceneGraph]="Scene" /> `,
	styles: [''],
})
export class AppComponent {
	readonly Scene = Scene;
}
