import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ENVIRONMENT_PRESETS, type NgtsEnvironmentPresets } from 'angular-three-soba/staging';
import { TweakpaneCheckbox, TweakpaneFolder, TweakpaneList, TweakpanePane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene';
import { FlowShieldState } from './state';

@Component({
	template: `
		<ngt-canvas
			[camera]="{ fov: 50, near: 0.1, far: 200, position: [8, 5, 8] }"
			[gl]="{ antialias: true, alpha: false }"
			[dpr]="[1, 1.5]"
			shadows
			style="background: #0e0d0c"
		>
			<app-flow-shield-scene-graph *canvasContent />
		</ngt-canvas>

		<tweakpane-pane title="Force shield" [expanded]="true">
			<tweakpane-folder title="Grid">
				<tweakpane-checkbox label="show" [(value)]="state.grid.show" />
			</tweakpane-folder>
			<tweakpane-folder title="Environment">
				<tweakpane-list label="preset" [(value)]="state.environment.preset" [options]="presets" />
			</tweakpane-folder>
		</tweakpane-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, TweakpanePane, TweakpaneCheckbox, TweakpaneList, TweakpaneFolder],
	host: { class: 'flow-shield-soba' },
	providers: [FlowShieldState],
})
export default class FlowShield {
	protected state = inject(FlowShieldState);
	protected presets = Object.keys(ENVIRONMENT_PRESETS) as NgtsEnvironmentPresets[];
}
