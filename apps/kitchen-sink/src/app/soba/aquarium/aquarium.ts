import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

// <Canvas shadows camera={{ position: [30, 0, -3], fov: 35, near: 1, far: 50 }} gl={{ stencil: true }}>

@Component({
	template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			shadows
			[camera]="{ position: [30, 0, -3], fov: 35, near: 1, far: 50 }"
			[gl]="{ stencil: true }"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'aquarium' },
	imports: [NgtCanvas],
})
export default class Aquarium {
	protected sceneGraph = Experience;
}
