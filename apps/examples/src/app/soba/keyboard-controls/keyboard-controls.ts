import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [0, 10, 15], fov: 50 }" shadows>
			<app-keyboard-controls-scene-graph *canvasContent />
		</ngt-canvas>
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-sm text-white">
			WASD / arrow keys to move &middot; Space to change color
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'keyboard-controls-soba' },
})
export default class KeyboardControls {}
