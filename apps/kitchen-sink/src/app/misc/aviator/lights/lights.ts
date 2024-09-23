import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtArgs } from 'angular-three';

@Component({
	selector: 'app-lights',
	standalone: true,
	template: `
		<ngt-hemisphere-light color="#aaaaaa" groundColor="#000000" [intensity]="Math.PI * 0.9" />
		<ngt-ambient-light color="#dc8874" [intensity]="Math.PI * 0.5" />
		<ngt-directional-light color="#ffffff" [position]="[150, 350, 350]" [castShadow]="true" [intensity]="Math.PI * 0.9">
			<ngt-orthographic-camera *args="[-400, 400, 400, -400, 1, 1000]" attach="shadow.camera" />
			<ngt-vector2 *args="[4096, 4096]" attach="shadow.mapSize" />
		</ngt-directional-light>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Lights {
	protected readonly Math = Math;
}
