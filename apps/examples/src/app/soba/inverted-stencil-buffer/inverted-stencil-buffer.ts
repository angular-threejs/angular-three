import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtTweakCheckbox, NgtTweakList, NgtTweakPane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph, invert, logo } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [gl]="{ stencil: true }">
			<app-inverted-stencil-buffer-scene-graph *canvasContent />
		</ngt-canvas>

		<ngt-tweak-pane title="Inverted Stencil Buffer">
			<ngt-tweak-checkbox [(value)]="invert" label="invert" />
			<ngt-tweak-list [(value)]="logo" [options]="['angular', 'nx', 'nx-cloud']" label="logo" />
		</ngt-tweak-pane>
	`,
	host: { class: 'inverted-stencil-buffer-soba' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph, NgtTweakPane, NgtTweakCheckbox, NgtTweakList],
})
export default class InvertedStencilBuffer {
	protected invert = invert;
	protected logo = logo;
}
