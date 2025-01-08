import { ChangeDetectionStrategy, Component } from '@angular/core';
import { extend, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { RockStore } from './store';

extend(THREE);

@Component({
	template: `
		<ngt-canvas sceneGraph="routed" [camera]="{ position: [8.978, 1.426, 2.766] }" shadows />
	`,
	imports: [NgtCanvas],
	providers: [RockStore],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'routed-rocks block h-svh' },
})
export default class RoutedRocks {}
