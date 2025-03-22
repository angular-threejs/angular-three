import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, NgtArgs } from 'angular-three';
import { NgtsEdges } from 'angular-three-soba/abstractions';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { NgtsPivotControls } from 'angular-three-soba/gizmos';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtsMeshPortalMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

import aoboxGLB from './aobox-transformed.glb' with { loader: 'file' };

type AOBoxGLTF = GLTF & {
	nodes: { Cube: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> };
};

@Component({
	selector: 'app-material-side',
	template: `
		<ngts-mesh-portal-material [attach]="attach()">
			<ng-template>
				<!-- Everything in here is inside the portal and isolated from the canvas -->
				<ngt-ambient-light [intensity]="0.5 * Math.PI" />
				<ngts-environment [options]="{ preset: 'city' }" />

				<!-- A box with baked AO -->
				@if (gltf.value(); as gltf) {
					<ngt-mesh castShadow receiveShadow [rotation]="rotation()" [geometry]="gltf.nodes.Cube.geometry">
						<ngt-mesh-standard-material
							[aoMapIntensity]="1"
							[aoMap]="gltf.nodes.Cube.material.aoMap"
							[color]="bg()"
						/>
						<ngt-spot-light
							castShadow
							[color]="bg()"
							[intensity]="2 * Math.PI"
							[position]="10"
							[angle]="0.15"
							[penumbra]="1"
							[decay]="0"
							[shadow.normalBias]="0.05"
							[shadow.bias]="0.0001"
						/>
					</ngt-mesh>
				}

				<!-- The shape -->
				<ngt-mesh #shape castShadow receiveShadow>
					<ng-content />
					<ngt-mesh-standard-material [color]="bg()" />
				</ngt-mesh>
			</ng-template>
		</ngts-mesh-portal-material>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsMeshPortalMaterial, NgtsEnvironment],
})
export class Side {
	protected readonly Math = Math;

	rotation = input([0, 0, 0]);
	bg = input.required<THREE.ColorRepresentation>();
	index = input.required<number>();

	protected attach = computed(() => ['material', this.index()]);

	protected gltf = gltfResource<AOBoxGLTF>(() => aoboxGLB);
	private shapeRef = viewChild<ElementRef<THREE.Mesh>>('shape');

	constructor() {
		beforeRender(({ delta }) => {
			const shape = this.shapeRef()?.nativeElement;
			if (!shape) return;
			shape.rotation.x = shape.rotation.y += delta;
		});
	}
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color attach="background" *args="['#a0a0a0']" />
		<ngts-camera-controls [options]="{ makeDefault: true }" />

		<ngts-pivot-controls [options]="{ anchor: [-1.1, -1.1, -1.1], scale: 0.75, lineWidth: 3.5 }">
			<ngt-mesh>
				<ngt-box-geometry *args="[2, 2, 2]" />
				<ngts-edges [options]="{ lineWidth: 2 }" />

				<app-material-side [rotation]="[0, 0, 0]" bg="orange" [index]="0">
					<ngt-torus-geometry *args="[0.65, 0.3, 64]" />
				</app-material-side>

				<app-material-side [rotation]="[0, Math.PI, 0]" bg="lightblue" [index]="1">
					<ngt-torus-knot-geometry *args="[0.55, 0.2, 128, 32]" />
				</app-material-side>

				<app-material-side [rotation]="[0, Math.PI / 2, Math.PI / 2]" bg="lightgreen" [index]="2">
					<ngt-box-geometry *args="[1.15, 1.15, 1.15]" />
				</app-material-side>

				<app-material-side [rotation]="[0, Math.PI / 2, -Math.PI / 2]" bg="aquamarine" [index]="3">
					<ngt-octahedron-geometry />
				</app-material-side>

				<app-material-side [rotation]="[0, -Math.PI / 2, 0]" bg="indianred" [index]="4">
					<ngt-icosahedron-geometry />
				</app-material-side>

				<app-material-side [rotation]="[0, Math.PI / 2, 0]" bg="hotpink" [index]="5">
					<ngt-dodecahedron-geometry />
				</app-material-side>
			</ngt-mesh>
		</ngts-pivot-controls>
	`,
	imports: [NgtsCameraControls, NgtArgs, Side, NgtsPivotControls, NgtsEdges],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	protected readonly Math = Math;
}
