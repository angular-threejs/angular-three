import { Component } from '@angular/core';
import { NgtRouterOutlet } from 'angular-three';
import { NgtsCameraControls } from 'angular-three-soba/controls';

@Component({
	template: `
		<ngt-router-outlet />
		<ngts-camera-controls />
	`,
	imports: [NgtRouterOutlet, NgtsCameraControls],
})
export class CustomRoutedScene {}
