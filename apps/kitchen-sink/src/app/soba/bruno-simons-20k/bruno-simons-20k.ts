import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { ToggleButton } from '../../toggle-button';
import { debug, Experience } from './experience';

@Component({
    template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			flat
			shadows
			[gl]="{ antialias: false }"
			[camera]="{ position: [-30, 35, -15], near: 30, far: 55, fov: 12 }"
		/>

		<div class="absolute top-10 right-2">
			<button [(toggleButton)]="debug">Toggle debug</button>
		</div>
	`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'bruno-simons-2k-soba' },
    imports: [NgtCanvas, ToggleButton]
})
export default class BrunoSimons20k {
	protected sceneGraph = Experience;
	protected debug = debug;
}
