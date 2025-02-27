import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtrCuboidCollider, NgtrPhysics } from 'angular-three-rapier';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { NgtsPreload } from 'angular-three-soba/misc';
import { NgtsContactShadows, NgtsEnvironment, NgtsLightformer } from 'angular-three-soba/staging';
import { SceneGraph as BasicSceneGraph } from '../basic/scene';
import { SceneGraph as InstancedVertexColorsSceneGraph } from '../instanced-vertex-colors/scene';
import { SceneGraph as InstancesSceneGraph } from '../instances/scene';
import { SceneGraph as InvertedStencilBufferSceneGraph } from '../inverted-stencil-buffer/scene';
import { SceneGraph as LodSceneGraph } from '../lod/scene';
import { SceneGraph as LowpolyEarthSceneGraph } from '../lowpoly-earth/scene';
import { SceneGraph as ShakySceneGraph } from '../shaky/scene';
import { Letter } from './letter';

/* credit: https://pmndrs.github.io/examples/demos/portal-shapes */

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['#4899c9']" attach="background" />

		<ngtr-physics [options]="{ gravity: [0, -60, 0] }">
			<ng-template>
				<!-- ANGULAR -->
				<app-letter char="A" [position]="[1, 50, -1]">
					<ng-template>
						<ngt-group [scale]="10">
							<app-basic-scene-graph asRenderTexture />
						</ngt-group>
					</ng-template>
				</app-letter>

				<app-letter char="N" [position]="[2, 60, -2]" [rotation]="[4, 5, 6]">
					<ng-template>
						<ngt-group [scale]="10">
							<app-instances-scene-graph asRenderTexture />
						</ngt-group>
					</ng-template>
				</app-letter>

				<app-letter char="G" [position]="[3, 70, 2]" [rotation]="[7, 8, 9]">
					<ng-template>
						<app-instanced-vertex-colors-scene-graph asRenderTexture />
					</ng-template>
				</app-letter>

				<app-letter char="U" [position]="[-1, 80, 3]" [rotation]="[10, 11, 12]">
					<ng-template>
						<app-lod-scene-graph asRenderTexture />
					</ng-template>
				</app-letter>

				<app-letter char="L" [position]="[-2, 90, 2]" [rotation]="[13, 14, 15]">
					<ng-template>
						<ngt-group [scale]="10">
							<app-lowpoly-earth-scene-graph asRenderTexture />
						</ngt-group>
					</ng-template>
				</app-letter>

				<app-letter char="A" [position]="[-3, 100, -3]" [rotation]="[16, 17, 18]">
					<ng-template>
						<app-shaky-scene-graph asRenderTexture />
					</ng-template>
				</app-letter>

				<app-letter char="R" [position]="[-4, 110, 1]" [rotation]="[19, 20, 21]" stencilBuffer>
					<ng-template>
						<ngt-group [scale]="5">
							<app-inverted-stencil-buffer-scene-graph asRenderTexture />
						</ngt-group>
					</ng-template>
				</app-letter>

				<!-- invisible walls -->
				<ngt-object3D [cuboidCollider]="[100, 1, 100]" [position]="[0, -6, 0]" />
				<ngt-object3D [cuboidCollider]="[30, 100, 1]" [position]="[0, 0, -30]" />
				<ngt-object3D [cuboidCollider]="[30, 100, 1]" [position]="[0, 0, 10]" />
				<ngt-object3D [cuboidCollider]="[1, 100, 30]" [position]="[-30, 0, 0]" />
				<ngt-object3D [cuboidCollider]="[1, 100, 30]" [position]="[30, 0, 0]" />
			</ng-template>
		</ngtr-physics>

		<!-- environment -->
		<ngts-environment
			[options]="{
				files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr',
				resolution: 1024,
			}"
		>
			<ng-template>
				<!-- On top of the HDRI we add some rectangular and circular shapes for nicer reflections -->
				<ngt-group [rotation]="[-Math.PI / 3, 0, 0]">
					<ngts-lightformer
						[options]="{
							intensity: 4 * Math.PI,
							rotation: [Math.PI / 2, 0, 0],
							position: [0, 5, -9],
							scale: [10, 10, 1],
						}"
					/>
					@for (x of [2, 0, 2, 0, 2, 0, 2, 0]; track $index) {
						<ngts-lightformer
							[options]="{
								form: 'circle',
								intensity: 4 * Math.PI,
								rotation: [Math.PI / 2, 0, 0],
								position: [x, 4, $index * 4],
								scale: [4, 1, 1],
							}"
						/>
					}
					<ngts-lightformer
						[options]="{
							intensity: 2 * Math.PI,
							rotation: [0, Math.PI / 2, 0],
							position: [-5, 1, -1],
							scale: [50, 2, 1],
						}"
					/>
					<ngts-lightformer
						[options]="{
							intensity: 2 * Math.PI,
							rotation: [0, -Math.PI / 2, 0],
							position: [10, 1, 0],
							scale: [50, 2, 1],
						}"
					/>
				</ngt-group>
			</ng-template>
		</ngts-environment>

		<!-- contact shadows for naive soft shadows -->
		<ngts-contact-shadows
			[options]="{ smooth: false, scale: 100, position: [0, -5.05, 0], blur: 0.5, opacity: 0.75 }"
		/>

		<!-- yomotsu/camera-controls, a better replacement for OrbitControls -->
		<ngts-camera-controls
			[options]="{ makeDefault: true, dollyToCursor: true, minPolarAngle: 0, maxPolarAngle: Math.PI / 2 }"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtrPhysics,
		NgtrCuboidCollider,
		NgtsEnvironment,
		NgtsLightformer,
		NgtsContactShadows,
		NgtsCameraControls,
		Letter,
		NgtArgs,
		BasicSceneGraph,
		InstancesSceneGraph,
		InstancedVertexColorsSceneGraph,
		LodSceneGraph,
		LowpolyEarthSceneGraph,
		ShakySceneGraph,
		InvertedStencilBufferSceneGraph,
	],
	hostDirectives: [NgtsPreload],
})
export class SceneGraph {
	protected readonly Math = Math;

	private preload = inject(NgtsPreload, { host: true });

	constructor() {
		this.preload.all.set(true);
	}
}
