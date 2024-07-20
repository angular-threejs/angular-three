import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { SceneGraph } from './scene-graph.component';

@Component({
	selector: 'test',
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="SceneGraph" />
	`,
	imports: [NgtCanvas],
})
export default class Test {
	SceneGraph = SceneGraph;
}
