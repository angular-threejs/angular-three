import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { Scene } from './scene';

@Component({
	template: `
		<ngt-canvas>
			<app-scene *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, Scene],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Basic {}
