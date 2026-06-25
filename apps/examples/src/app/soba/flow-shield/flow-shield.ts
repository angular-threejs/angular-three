import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ENVIRONMENT_PRESETS, type NgtsEnvironmentPresets } from 'angular-three-soba/staging';
import { TweakpaneCheckbox, TweakpaneList, TweakpanePane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas
			[camera]="{ fov: 50, near: 0.1, far: 200, position: [8, 5, 8] }"
			[gl]="{ antialias: true, alpha: false }"
			[dpr]="[1, 1.5]"
			shadows
			style="background: #0e0d0c"
		>
			<app-flow-shield-scene-graph *canvasContent [showGrid]="showGrid()" [preset]="preset()" />
		</ngt-canvas>

		<tweakpane-pane title="Force shield" [expanded]="true">
			<tweakpane-checkbox label="show grid" [(value)]="showGrid" />
			<tweakpane-list label="environment preset" [(value)]="preset" [options]="presets" />
		</tweakpane-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, TweakpanePane, TweakpaneCheckbox, TweakpaneList],
	host: { class: 'flow-shield-soba' },
})
export default class FlowShield {
	protected showGrid = signal(true);
	protected preset = signal<NgtsEnvironmentPresets>('night');
	protected presets = Object.keys(ENVIRONMENT_PRESETS) as NgtsEnvironmentPresets[];
}
