import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
    template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			[gl]="{ antialias: false }"
			[camera]="{ position: [0, 0, 15], near: 5, far: 20 }"
		/>
	`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtCanvas],
    host: { class: 'instanced-vertex-colors-soba' }
})
export default class InstancedVertexColors {
	protected sceneGraph = Experience;
}
