import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="scene"
			[camera]="{ far: 100, near: 1, position: [-25, 20, 25], zoom: 35 }"
			[orthographic]="true"
			[shadows]="true"
		/>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'monday-morning-cannon cursor-none' },
})
export default class MondayMorning {
	protected scene = Experience;
}
