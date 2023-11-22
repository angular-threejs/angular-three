import { NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { NgtArgs, NgtCanvas } from 'angular-three-old';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
import { NgtsHtml } from 'angular-three-soba-old/misc';
import { NgtsSobaContent } from 'angular-three-soba-old/utils';

const active = signal(false);

@Component({
	selector: 'cubes-html-button',
	standalone: true,
	template: `
		<button
			(click)="active.set(!active())"
			type="button"
			class="transition-colors duration-1000  text-white px-2 py-1 rounded shadow"
			[class]="active() ? ['bg-red-400', 'hover:bg-red-600'] : ['bg-blue-400', 'hover:bg-blue-600']"
		>
			Click me
		</button>
		<div *ngIf="active()">Extra content under ngIf</div>
	`,
	imports: [NgIf],
})
export class Button {
	active = active;
}

@Component({
	standalone: true,
	templateUrl: './scene.html',
	imports: [NgtsOrbitControls, NgtArgs, NgtsHtml, NgtsSobaContent, Button],
})
export class Scene {
	hover = signal(false);

	onBeforeRender(cube: THREE.Mesh) {
		cube.rotation.y += 0.01;
	}
}

@Component({
	standalone: true,
	templateUrl: './index.html',
	imports: [NgtCanvas],
})
export default class Cubes {
	sceneGraph = Scene;
	active = active;
}
