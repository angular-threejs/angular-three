import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, NgZone, effect, signal } from '@angular/core';
import { NgtBeforeRenderEvent, NgtCanvas, extend, injectNgtStore } from 'angular-three';
import { injectNgtRef } from 'libs/core/src/lib/ref';
import * as THREE from 'three';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<ngt-mesh
			(click)="click($event)"
			(pointerover)="hover.set(true)"
			(pointerout)="hover.set(false)"
			(beforeRender)="onBeforeRender($any($event))"
			[ref]="ref"
			[scale]="active() ? 1.5 : 1"
		>
			<ngt-box-geometry />
			<ngt-mesh-basic-material [color]="hover() ? 'pink' : 'orange'" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	private store = injectNgtStore();

	ref = injectNgtRef<THREE.Mesh>();

	active = signal(false);
	hover = signal(false);

	constructor() {
		effect(() => {
			console.log(this.ref.nativeElement);
		});
	}

	ngOnInit() {
		console.log('here????', this.store, NgZone.isInAngularZone());
	}

	click(event: any) {
		this.active.update((state) => !state);
	}

	onBeforeRender({ object }: NgtBeforeRenderEvent<THREE.Mesh>) {
		object.rotation.x += 0.01;
		object.rotation.y += 0.01;
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
