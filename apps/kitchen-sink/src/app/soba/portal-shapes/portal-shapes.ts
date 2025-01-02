import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
    template: `
		<ngt-canvas [sceneGraph]="sceneGraph" shadows [camera]="{ fov: 45, position: [-20, 40, 30], near: 1, far: 300 }" />
	`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtCanvas]
})
export default class PortalShapes {
	protected sceneGraph = Experience;
}
