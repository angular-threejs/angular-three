import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { AudioStore } from './audio.store';
import { Overlay } from './overlay';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ position: [-1, 1.5, 2], fov: 25 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<app-overlay />
	`,
	imports: [NgtCanvas, Overlay, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'simple-sound-analyser-soba block h-full w-full' },
	styles: `
		:host {
			background: linear-gradient(15deg, rgb(82, 81, 88) 0%, rgb(255, 247, 248) 100%);
		}
	`,
	providers: [AudioStore],
})
export default class SimpleSoundAnalyser {}
