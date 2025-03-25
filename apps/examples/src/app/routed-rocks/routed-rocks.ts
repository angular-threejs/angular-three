import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtRoutedScene } from 'angular-three';
import { NgtCanvas } from 'angular-three/dom';
import { RockStore } from './store';

@Component({
	template: `
		<ngt-canvas [camera]="{ position: [8.978, 1.426, 2.766] }" shadows>
			<ngt-routed-scene *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, NgtRoutedScene],
	providers: [RockStore],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'routed-rocks block h-svh' },
})
export default class RoutedRocks {}
