import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { ToggleButton } from '../toggle-button';
import { debug, interpolate, paused, RapierWrapperDefault } from './wrapper-default';

@Component({
    template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [shadows]="true" [dpr]="1" />
		<div class="absolute top-2 right-2 font-mono flex gap-4">
			<button [(toggleButton)]="debug">debug</button>
			<button [(toggleButton)]="interpolate">interpolate</button>
			<button [(toggleButton)]="paused">paused</button>
		</div>
	`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtCanvas, ToggleButton]
})
export default class RapierWrapper {
	protected sceneGraph = RapierWrapperDefault;

	protected debug = debug;
	protected interpolate = interpolate;
	protected paused = paused;
}
