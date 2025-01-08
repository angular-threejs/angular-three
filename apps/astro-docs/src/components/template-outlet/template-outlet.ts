import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { extend, injectBeforeRender, NgtCanvas } from 'angular-three';
import { NgtsGrid } from 'angular-three-soba/abstractions';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import * as THREE from 'three';
import { DEG2RAD } from 'three/src/math/MathUtils.js';

extend(THREE);

@Component({
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [10, 10, 10], fov: 30 }" />
		<ngts-orbit-controls
			[options]="{
				enableZoom: false,
				maxPolarAngle: 85 * DEG2RAD,
				minPolarAngle: 20 * DEG2RAD,
				maxAzimuthAngle: 45 * DEG2RAD,
				minAzimuthAngle: -45 * DEG2RAD,
			}"
		/>

		<ngts-grid
			[options]="{
				planeArgs: [10.5, 10.5],
				position: [0, -0.01, 0],
				cellSize: 0.6,
				cellThickness: 1,
				cellColor: '#6f6f6f',
				sectionSize: 3.3,
				sectionThickness: 1.5,
				sectionColor: '#9d4b4b',
				fadeDistance: 25,
				fadeStrength: 1,
				followCamera: false,
				infiniteGrid: true,
			}"
		/>

		<ngt-directional-light [position]="[5, 10, 3]" />

		<ngt-object3D #trail [position]="[0, 0.5, 0]">
			<ng-container [ngTemplateOutlet]="forTrail" />
		</ngt-object3D>

		<ng-template #forTrail>
			<ng-container [ngTemplateOutlet]="mesh" [ngTemplateOutletContext]="{ color: '#fe3d00' }" />
			<ngt-group [position]="[0, 1, 0]">
				<ng-container [ngTemplateOutlet]="mesh" [ngTemplateOutletContext]="{ color: '#2f7dc6' }" />
			</ngt-group>
		</ng-template>

		<ng-template #mesh let-color="color">
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-standard-material [color]="color" />
			</ngt-mesh>
		</ng-template>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsOrbitControls, NgtsPerspectiveCamera, NgtsGrid, NgTemplateOutlet],
	host: { class: 'template-outlet-experience' },
})
export class Experience {
	protected readonly DEG2RAD = DEG2RAD;

	private trailRef = viewChild.required<ElementRef<THREE.Object3D>>('trail');

	constructor() {
		injectBeforeRender(() => {
			const obj = this.trailRef().nativeElement;
			obj.position.x = Math.sin(Date.now() / 1000) * 4;
		});
	}
}

@Component({
	template: `
		<ngt-canvas [sceneGraph]="scene" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'template-outlet-docs' },
})
export default class TemplateOutletScene {
	scene = Experience;
}
