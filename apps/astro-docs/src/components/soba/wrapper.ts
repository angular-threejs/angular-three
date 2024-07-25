import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { extend, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { CANVAS_OPTIONS, provideCanvasOptions } from './canvas-options';
import { SceneGraph } from './scene-graph';
import { type SceneKeys, type SceneOptions, scenes } from './scenes';
import { provideSobaContent, SOBA_CONTENT } from './soba-content';

extend(THREE);

@Component({
	selector: 'soba-wrapper',
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			[camera]="camera()"
			[orthographic]="orthographic()"
			[performance]="performance()"
			[shadows]="true"
		/>
	`,
	host: { class: 'soba-wrapper block h-96 w-full border border-dashed border-accent-500 rounded' },
	providers: [provideCanvasOptions(), provideSobaContent()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
})
export class SobaWrapper {
	sceneGraph = SceneGraph;

	scene = input.required<SceneKeys>();

	private sobaContent = inject(SOBA_CONTENT);
	private canvasOptionsStore = inject(CANVAS_OPTIONS);
	camera = this.canvasOptionsStore.select('camera');
	orthographic = this.canvasOptionsStore.select('orthographic');
	performance = this.canvasOptionsStore.select('performance');

	constructor() {
		effect(
			() => {
				const sceneKey = this.scene();

				const { scene, canvasOptions } = sceneKey.split('.').reduce((acc, cur) => {
					return acc[cur];
				}, scenes) as SceneOptions;

				this.sobaContent.set(scene);
				if (canvasOptions) this.canvasOptionsStore.update(canvasOptions);
			},
			{ allowSignalWrites: true },
		);
	}
}
