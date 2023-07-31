import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { NgtCanvas } from '@platform/core-temp-three';

@Component({
	standalone: true,
	template: `<div>test</div>`,
})
export class Scene {}

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
