import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { ToggleButton } from '../toggle-button';
import { debug, interpolate, paused, RapierWrapperDefault } from './wrapper-default';

@Component({
	template: `
		<ngt-canvas [shadows]="true" [dpr]="1">
			<app-rapier-wrapper-default *canvasContent />
		</ngt-canvas>
		<div class="absolute top-2 right-2 font-mono flex gap-4">
			<button [(toggleButton)]="debug">debug</button>
			<button [(toggleButton)]="interpolate">interpolate</button>
			<button [(toggleButton)]="paused">paused</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, ToggleButton, NgtCanvasContent, RapierWrapperDefault],
})
export default class RapierWrapper {
	protected sceneGraph = RapierWrapperDefault;

	protected debug = debug;
	protected interpolate = interpolate;
	protected paused = paused;
}
