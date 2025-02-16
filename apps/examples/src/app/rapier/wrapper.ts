import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgtTweakCheckbox, NgtTweakPane } from 'angular-three-tweakpane';
import { NgtCanvas } from 'angular-three/dom';
import { RapierWrapperDefault } from './wrapper-default';

@Component({
	template: `
		<ngt-canvas shadows [dpr]="1">
			<ng-template canvasContent>
				<app-rapier-wrapper-default [debug]="debug()" [interpolate]="interpolate()" [paused]="paused()" />
				<ngt-tweak-pane title="Rapier" [expanded]="true">
					<ngt-tweak-checkbox [(value)]="debug" label="debug" />
					<ngt-tweak-checkbox [(value)]="interpolate" label="interpolate" />
					<ngt-tweak-checkbox [(value)]="paused" label="paused" />
				</ngt-tweak-pane>
			</ng-template>
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, RapierWrapperDefault, NgtTweakPane, NgtTweakCheckbox],
})
export default class RapierWrapper {
	protected debug = signal(true);
	protected interpolate = signal(false);
	protected paused = signal(false);
}
