import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { extend, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { scenes } from './scenes';

extend(THREE);

@Component({
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph()" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'first-scene' },
})
export default class FirstScene {
	step = input.required<keyof typeof scenes>();
	sceneGraph = computed(() => scenes[this.step()]);
}
