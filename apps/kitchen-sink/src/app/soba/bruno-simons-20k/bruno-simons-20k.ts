import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			flat
			shadows
			[gl]="{ antialias: false }"
			[camera]="{ position: [-30, 35, -15], near: 30, far: 55, fov: 12 }"
		/>
		<pre class="absolute top-2 right-2">
      Credits: <a class="underline" href="https://pmndrs.github.io/examples/demos/bruno-simons-20k-challenge" target="_blank">Bruno Simons 20K Challenge with R3F</a>
    </pre>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'bruno-simons-2k-soba' },
	imports: [NgtCanvas],
})
export default class BrunoSimons20k {
	protected sceneGraph = Experience;
}
