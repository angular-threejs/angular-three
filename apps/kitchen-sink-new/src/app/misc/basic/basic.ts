import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvasDeclarations } from 'angular-three/dom';
import { Scene } from './scene';

@Component({
	template: `
		<ngt-canvas>
			<app-scene *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvasDeclarations, Scene],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Basic {}
