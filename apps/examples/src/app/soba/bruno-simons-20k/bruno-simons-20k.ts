import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TweakpaneCheckbox, TweakpanePane } from 'angular-three-tweakpane';
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

		<tweakpane-pane title="Bruno Simons 20k">
			<tweakpane-checkbox [(value)]="debug" label="debug" />
			<tweakpane-checkbox [(value)]="withN8ao" label="withN8ao" />
		</tweakpane-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'bruno-simons-2k-soba' },
	imports: [NgtCanvas, SceneGraph, TweakpanePane, TweakpaneCheckbox],
})
export default class BrunoSimons20k {
	protected debug = debug;
	protected withN8ao = withN8ao;
}
