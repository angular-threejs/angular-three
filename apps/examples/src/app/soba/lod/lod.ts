import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtsLoader } from 'angular-three-soba/loaders';
import { NgtsStats } from 'angular-three-soba/stats';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas stats frameloop="demand" [camera]="{ position: [0, 0, 40] }">
			<app-lod-scene-graph *canvasContent />
		</ngt-canvas>
		<ngts-loader />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, NgtsLoader, NgtsStats, SceneGraph],
	host: { class: 'lod-soba' },
})
export default class LOD {}
