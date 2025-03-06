import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtTweakCheckbox, NgtTweakPane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { debug, SceneGraph, withN8ao } from './scene';

@Component({
	template: `
		<ngt-canvas
			flat
			shadows
			[gl]="{ antialias: false }"
			[camera]="{ position: [-30, 35, -15], near: 30, far: 55, fov: 12 }"
		>
			<app-bruno-scene-graph *canvasContent />
		</ngt-canvas>

		<ngt-tweak-pane title="Bruno Simons 20k">
			<ngt-tweak-checkbox [(value)]="debug" label="debug" />
			<ngt-tweak-checkbox [(value)]="withN8ao" label="withN8ao" />
		</ngt-tweak-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'bruno-simons-2k-soba' },
	imports: [NgtCanvas, SceneGraph, NgtTweakPane, NgtTweakCheckbox],
})
export default class BrunoSimons20k {
	protected debug = debug;
	protected withN8ao = withN8ao;
}
