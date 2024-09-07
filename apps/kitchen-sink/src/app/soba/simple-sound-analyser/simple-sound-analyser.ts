import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { AudioStore } from './audio.store';
import { Experience } from './experience';
import { Overlay } from './overlay';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [shadows]="true" [camera]="{ position: [-1, 1.5, 2], fov: 25 }" />
		<app-overlay />
	`,
	imports: [NgtCanvas, Overlay],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'simple-sound-analyser-soba block h-full w-full' },
	styles: `
		:host {
			background: linear-gradient(15deg, rgb(82, 81, 88) 0%, rgb(255, 247, 248) 100%);
		}
	`,
	providers: [AudioStore],
})
export default class SimpleSoundAnalyser {
	protected sceneGraph = Experience;
}
