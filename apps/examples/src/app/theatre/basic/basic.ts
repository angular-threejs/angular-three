import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TheatreProject, TheatreSheet, TheatreStudio } from 'angular-three-theatre';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';
import stateJson from './state.json';

@Component({
	template: `
		<ngt-canvas shadows>
			<theatre-project *canvasContent studio [config]="{ state }">
				<app-scene-graph sheet [sequence]="{ autoplay: true, iterationCount: Infinity }" />
			</theatre-project>
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, TheatreProject, TheatreStudio, TheatreSheet],
	host: { class: 'basic-theatre' },
})
export default class Basic {
	protected readonly state = stateJson;
	protected readonly Infinity = Infinity;
}
