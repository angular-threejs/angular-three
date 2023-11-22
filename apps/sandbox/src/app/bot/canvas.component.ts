import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-old';
import { BotScene } from './scene.component';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" />
	`,
	imports: [NgtCanvas],
	host: { class: 'bot-canvas' },
})
export class BotCanvas {
	scene = BotScene;
}
