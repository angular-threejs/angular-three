import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtsLoader } from 'angular-three-soba/loaders';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene-graph';

@Component({
	selector: 'app-sky-diving',
	template: `
		<ngt-canvas [camera]="{ position: [0, 0, 3], fov: 70 }" shadows>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		<ngts-loader />
	`,
	imports: [NgtCanvas, NgtsLoader, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'skydiving-soba' },
})
export default class SkyDiving {}
