import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TweakpaneAnchor, TweakpaneCheckbox, TweakpanePane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { RapierWrapperDefault } from './wrapper-default';

@Component({
	template: `
		<ngt-canvas shadows [dpr]="1" tweakpaneAnchor>
			<ng-template canvasContent>
				<app-rapier-wrapper-default [debug]="debug()" [interpolate]="interpolate()" [paused]="paused()" />
				<tweakpane-pane title="Rapier" [expanded]="true">
					<tweakpane-checkbox [(value)]="debug" label="debug" />
					<tweakpane-checkbox [(value)]="interpolate" label="interpolate" />
					<tweakpane-checkbox [(value)]="paused" label="paused" />
				</tweakpane-pane>
			</ng-template>
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, RapierWrapperDefault, TweakpanePane, TweakpaneCheckbox, TweakpaneAnchor],
})
export default class RapierWrapper {
	protected debug = signal(true);
	protected interpolate = signal(false);
	protected paused = signal(false);
}
