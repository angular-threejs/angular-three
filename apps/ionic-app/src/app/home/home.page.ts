import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { extend, injectBeforeRender, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { Mesh } from 'three';

extend(THREE);

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
export class Scene {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			const mesh = this.mesh().nativeElement;
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;
		});
	}
}

@Component({
	selector: 'platform-home',
	standalone: true,
	imports: [IonicModule, NgtCanvas],
	template: `
		<ion-content [fullscreen]="true">
			<div id="container">
				<ngt-canvas [sceneGraph]="scene" />
			</div>
		</ion-content>
	`,
	styles: `
		#container {
			text-align: center;
			position: absolute;
			left: 0;
			right: 0;
			top: 50%;
			height: 100%;
			transform: translateY(-50%);
		}
	`,
})
export class HomePage {
	scene = Scene;
}
