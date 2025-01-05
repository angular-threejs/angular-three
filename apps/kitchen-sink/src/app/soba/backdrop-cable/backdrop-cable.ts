import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" shadows [camera]="{ position: [0, 1.5, 3] }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
	host: { class: 'Backdrop-cable' },
})
export default class BackdropCable {
	protected sceneGraph = Experience;
}
