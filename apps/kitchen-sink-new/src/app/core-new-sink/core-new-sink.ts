import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtCanvas, NgtPortal, extend, injectBeforeRender, injectStore } from 'angular-three-core-new';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

extend(THREE);
extend({ OrbitControls });

@Component({
	selector: 'app-cube',
	standalone: true,
	template: `
		<ngt-mesh name="within-app-cube" [position]="position()" (click)="clicked.emit()">
			<ngt-box-geometry />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {
	position = input([0, 0, 0]);

	clicked = output();

	constructor() {
		console.log('created');

		inject(DestroyRef).onDestroy(console.log.bind(console, 'destroyed'));
	}
}

@Component({
	selector: 'app-arbitrary-shape',
	standalone: true,
	template: `
		<ngt-mesh [position]="position()" name="the-arbitrary">
			<ngt-mesh-basic-material>
				<ngt-value [rawValue]="color()" attach="color" />
			</ngt-mesh-basic-material>
			<ng-content />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArbitraryShape {
	position = input([0, 0, 0]);
	color = input('red');
}

@Component({
	selector: 'app-cube-with-content',
	standalone: true,
	template: `
		<ngt-mesh [position]="position()">
			<ngt-box-geometry />
			<ng-content select="[child]" />
		</ngt-mesh>

		<ng-content>
			<app-cube [position]="[4, 1.5, -4]" />
		</ng-content>
	`,
	imports: [Cube],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CubeWithContent {
	position = input([0, 0, 0]);
}

@Component({
	selector: 'app-arbitrary-plane',
	standalone: true,
	template: `
		<ngt-plane-geometry *args="args()" />
		@if (true) {
			<ngt-mesh name="within-if" />
		}
		@if (true) {
			<app-arbitrary-shape color="blue">
				<ng-content />
			</app-arbitrary-shape>
		}
	`,
	imports: [NgtArgs, ArbitraryShape],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArbitraryPlane {
	args = input([5, 5]);
}

@Component({
	selector: 'app-new-scene',
	standalone: true,
	template: `
		<ngt-mesh #mesh [position]="[2, 2, 0]" [scale]="scale()" (click)="active.set(!active())" name="the-top-dawg">
			<ngt-box-geometry />
			<ngt-mesh-basic-material color="green" />
		</ngt-mesh>

		<!--
		<app-cube [position]="[-2, -2, 0]" (clicked)="onCubeClicked()" />

		<app-arbitrary-shape [position]="[0, 0, -8]">
			@if (bigPlane()) {
				<app-arbitrary-plane [args]="[10, 10]">
					<ngt-cylinder-geometry *args="[2, 2]" />
				</app-arbitrary-plane>
			} @else {
				<app-arbitrary-plane>
					<ngt-circle-geometry />
				</app-arbitrary-plane>
			}
		</app-arbitrary-shape>
-->

		<ngt-portal [container]="portalScene">
			<ngt-mesh>
				<ngt-box-geometry *args="[2, 2, 2]" />
			</ngt-mesh>
		</ngt-portal>

		<!--
		<ngt-orbit-controls *args="[camera(), domElement()]" />
-->
		<ngts-orbit-controls />

		<!--
		<app-arbitrary-shape [position]="[-2, 2, 0]" color="hotpink">
			<ngt-torus-geometry *args="[2, 0.4, 12, 48]" />
		</app-arbitrary-shape>

		<app-cube-with-content [position]="[2, -2, 0]">
			<ngt-mesh-basic-material child color="orange" />

			<app-arbitrary-shape [position]="[0, 4, -4]">
				<ngt-torus-knot-geometry />
			</app-arbitrary-shape>
		</app-cube-with-content>

		<app-cube-with-content [position]="[0, -4, -4]">
			<app-arbitrary-shape child [position]="[0, 1, 0]">
				<ngt-cone-geometry />
			</app-arbitrary-shape>
		</app-cube-with-content>
    -->
	`,

	imports: [Cube, ArbitraryShape, CubeWithContent, NgtArgs, ArbitraryPlane, NgtPortal, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	private store = injectStore();

	gltf = injectGLTF(() => './ybot.glb');

	camera = this.store.select('camera');
	domElement = this.store.select('gl', 'domElement');
	connected = this.store.select('events', 'connected');

	// controls = computed(() => new OrbitControls(this.camera()));

	active = signal(false);
	scale = computed(() => (this.active() ? 1.5 : 1));

	portalScene = new THREE.Scene();

	mesh = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	bigPlane = signal(true);
	cubeArgs = computed(() => (this.bigPlane() ? [2, 2, 2] : [1, 1, 1]));

	constructor() {
		console.log(this.store.snapshot.scene);
		injectBeforeRender(() => {
			const mesh = this.mesh().nativeElement;
			mesh.rotation.x += 0.01;
			mesh.rotation.y += 0.01;
		});

		// effect(() => {
		// 	const [controls, domElement, connected] = [this.controls(), this.domElement(), this.connected()];
		// 	console.log(connected);
		// 	controls.connect(connected);
		// });

		effect((onCleanup) => {
			const id = setTimeout(() => {
				this.bigPlane.set(false);
			}, 6000);
			onCleanup(() => {
				clearTimeout(id);
			});
		});
	}

	onAttach(event: any) {
		console.log(event);
	}

	onCubeClicked() {
		console.log('cube clicked');
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
