import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { extend, injectBeforeRender, NgtArgs, NgtCanvas } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsContactShadows, NgtsEnvironment, NgtsLightformer } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { Mesh } from 'three';

extend(THREE);

@Component({
	template: `
		<ngts-environment [options]="{ background: true, preset: 'sunset' }">
			<ng-template>
				<ngt-color *args="['black']" attach="background" />
				<ngts-lightformer [options]="{ position: [0, 0, -5], scale: 10, color: 'red', intensity: 10, form: 'ring' }" />
			</ng-template>
		</ngts-environment>

		<ngt-mesh [position]="[-1.5, 0, 0]">
			<ngt-sphere-geometry />
			<ngt-mesh-standard-material color="orange" />
		</ngt-mesh>

		<ngt-mesh #cube [position]="[1.5, 0, 0]" [scale]="1.5">
			<ngt-box-geometry />
			<ngt-mesh-standard-material color="mediumpurple" />
		</ngt-mesh>

		<ngt-mesh [position]="[0, -1, 0]" [rotation]="[-Math.PI / 2, 0, 0]" [scale]="10">
			<ngt-plane-geometry />
			<ngt-mesh-standard-material color="greenyellow" />
		</ngt-mesh>

		<ngts-contact-shadows
			[options]="{ position: [0, -0.99, 0], scale: 10, resolution: 512, opacity: 0.4, blur: 2.8 }"
		/>

		<ngts-orbit-controls [options]="{ makeDefault: true, autoRotate: true, autoRotateSpeed: 0.5, enablePan: false }" />
	`,
	imports: [NgtsEnvironment, NgtsLightformer, NgtsContactShadows, NgtArgs, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Experience {
	protected readonly Math = Math;

	private cube = viewChild.required<ElementRef<Mesh>>('cube');

	constructor() {
		injectBeforeRender(({ delta }) => {
			const cube = this.cube().nativeElement;
			cube.rotation.y += delta * 0.2;
		});
	}
}

@Component({
	template: `
		<ngt-canvas [sceneGraph]="scene" [camera]="{ position: [-3, 3, 3] }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
})
export default class LightformerScene {
	scene = Experience;
}
