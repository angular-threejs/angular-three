import { Component } from '@angular/core';
import { NgtCanvasDeclarations, provideNgtRenderer } from 'angular-three/dom';
import { SceneGraph } from './scene-graph';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [0, 0, 2] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvasDeclarations, SceneGraph],
})
export default class SimpleScene {
	static clientProviders = [provideNgtRenderer()];
}
