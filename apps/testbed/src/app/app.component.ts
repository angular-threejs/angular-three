import { Component } from '@angular/core';
import { NgtCanvas, extend } from 'angular-three';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { Scene } from './scene/scene';

extend(THREE);
extend({ OrbitControls });

@Component({
	standalone: true,
	imports: [NgtCanvas],
	selector: 'platform-root',
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" />
	`,
})
export class AppComponent {
	sceneGraph = Scene;
}
