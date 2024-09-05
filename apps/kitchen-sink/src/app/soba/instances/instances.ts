import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './exprience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [camera]="{ position: [0, 0, 0.01] }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'instances-soba' },
	imports: [NgtCanvas],
})
export default class Instances {
	protected scene = Experience;
}
