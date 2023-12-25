import { Component } from '@angular/core';
import { NgtCanvas, extend } from 'angular-three';
import * as THREE from 'three';
import { Scene } from './scene/scene';

extend(THREE);

@Component({
	standalone: true,
	imports: [NgtCanvas],
	selector: 'platform-root',
	templateUrl: './app.component.html',
	host: {
		style: 'background: black; display: block; height: 100%; width: 100%',
	},
})
export class AppComponent {
	sceneGraph = Scene;
	// scene = VaporwareScene;
}
