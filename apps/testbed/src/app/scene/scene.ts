import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { NgtArgs, injectNgtStore } from 'angular-three';
import { Cube } from '../cube/cube';

@Component({
	standalone: true,
	templateUrl: './scene.html',
	imports: [Cube, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scene {
	protected Math = Math;

	private store = injectNgtStore();
	private camera = this.store.select('camera');
	private domElement = this.store.select('gl', 'domElement');

	protected controlsArgs = computed(() => [this.camera(), this.domElement()]);
}
