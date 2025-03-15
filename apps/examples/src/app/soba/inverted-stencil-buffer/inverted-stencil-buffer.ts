import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TweakpaneCheckbox, TweakpaneList, TweakpanePane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph, invert, logo } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [gl]="{ stencil: true }">
			<app-inverted-stencil-buffer-scene-graph *canvasContent />
		</ngt-canvas>

		<tweakpane-pane title="Inverted Stencil Buffer">
			<tweakpane-checkbox [(value)]="invert" label="invert" />
			<tweakpane-list [(value)]="logo" [options]="['angular', 'nx', 'nx-cloud']" label="logo" />
		</tweakpane-pane>
	`,
	host: { class: 'inverted-stencil-buffer-soba' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, TweakpanePane, TweakpaneCheckbox, TweakpaneList],
})
export default class InvertedStencilBuffer {
	protected invert = invert;
	protected logo = logo;
}
