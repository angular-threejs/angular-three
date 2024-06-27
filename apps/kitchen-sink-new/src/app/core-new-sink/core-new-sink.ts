import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, extend, injectStore } from 'angular-three-core-new';
import * as THREE from 'three';

extend(THREE);

@Component({
	selector: 'app-cube',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {}

@Component({
	selector: 'app-arbitrary-shape',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-mesh-basic-material />
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArbitraryShape {}

@Component({
	selector: 'app-cube-with-content',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
			<ng-content select="[child]" />
		</ngt-mesh>

		<ng-content />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CubeWithContent {}

@Component({
	selector: 'app-new-scene',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
		</ngt-mesh>

		<app-cube />

		<app-arbitrary-shape>
			<ngt-torus-geometry />
		</app-arbitrary-shape>

		<app-cube-with-content>
			<ngt-mesh-basic-material child />

			<app-arbitrary-shape>
				<ngt-torus-knot-geometry />
			</app-arbitrary-shape>
		</app-cube-with-content>

		<app-cube-with-content>
			<app-arbitrary-shape child>
				<ngt-cone-geometry />
			</app-arbitrary-shape>
		</app-cube-with-content>
	`,
	imports: [Cube, ArbitraryShape, CubeWithContent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	private store = injectStore();

	constructor() {
		console.log(this.store.snapshot.scene);
	}
}

@Component({
	standalone: true,
	template: `
		hi there
		<ngt-canvas [sceneGraph]="scene" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'core-new-sink block h-screen' },
})
export default class CoreNewSink {
	scene = Scene;
}
