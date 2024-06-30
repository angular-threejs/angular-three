import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three-core-new';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[sceneGraph]="scene"
			[options]="{
				shadows: true,
				camera: { far: 100, near: 1, zoom: 25, position: [-25, 20, 25] },
				orthographic: true
			}"
		/>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'monday-morning-cannon cursor-none' },
})
export default class MondayMorning {
	scene = Experience;
}
