import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { extend, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { Experience } from './experience';

extend(THREE);

@Component({
	selector: 'platform-home',
	standalone: true,
	imports: [IonicModule, NgtCanvas],
	template: `
		<ion-content [fullscreen]="true">
			<div id="container">
				<ngt-canvas [sceneGraph]="scene" [camera]="{ position: [0, -12, 16] }" [shadows]="true" />
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
	scene = Experience;
}
