import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { NgtsLoader } from 'angular-three-soba/loaders';
import { SceneGraph } from './scene-graph';

@Component({
	selector: 'app-sky-diving',
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ position: [0, 0, 3], fov: 70 }" [shadows]="true" />
		<ngts-loader />
	`,
	standalone: true,
	imports: [NgtCanvas, NgtsLoader],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'skydiving-soba' },
})
export default class SkyDiving {
	protected sceneGraph = SceneGraph;
}
