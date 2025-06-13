import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { loaderResource, NgtArgs } from 'angular-three';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsFontInput } from 'angular-three-soba/loaders';
import { NgtsMeshTransmissionMaterial, NgtsMeshTransmissionMaterialOptions } from 'angular-three-soba/materials';
import { NgtsInstance, NgtsInstances } from 'angular-three-soba/performances';
import {
	NgtsAccumulativeShadows,
	NgtsCenter,
	NgtsEnvironment,
	NgtsLightformer,
	NgtsRandomizedLights,
} from 'angular-three-soba/staging';
import { RGBELoader } from 'three-stdlib';
import { Tweaks } from './tweaks';

import fontGlyphs from './inter_medium.json';

@Component({
	selector: 'app-grid',
	template: `
		<ngts-instances [options]="{ position: [0, -1.02, 0] }">
			<ngt-plane-geometry *args="[lineWidth(), height()]" />
			<ngt-mesh-basic-material color="#999" />
			@let _amount = amount();
			@let _count = count();
			@for (y of _amount; track $index) {
				@for (x of _amount; track $index) {
					<ngt-group
						[position]="[x * 2 - Math.floor(_count / 2) * 2, -0.01, y * 2 - Math.floor(_count / 2) * 2]"
					>
						<ngts-instance [options]="{ rotation: [-Math.PI / 2, 0, 0] }" />
						<ngts-instance [options]="{ rotation: [-Math.PI / 2, 0, Math.PI / 2] }" />
					</ngt-group>
				}
			}
			<ngt-grid-helper *args="[100, 100, '#bbb', '#bbb']" [position]="[0, -0.01, 0]" />
		</ngts-instances>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsInstances, NgtArgs, NgtsInstance],
})
export class Grid {
	count = input(23);
	lineWidth = input(0.026);
	height = input(0.5);

	protected amount = computed(() => Array.from({ length: this.count() }, (_, index) => index));
	protected readonly Math = Math;
}

@Component({
	selector: 'app-text-and-grid',
	template: `
		<ngt-group>
			<ngts-center
				[options]="{
					front: true,
					top: true,
					scale: [0.8, 1, 1],
					rotation: [-Math.PI / 2, 0, 0],
					position: [0, -1, 2.25],
				}"
			>
				<ngts-text-3d
					[text]="text()"
					[font]="fontGlyphs"
					[options]="{
						castShadow: true,
						bevelEnabled: true,
						bevelThickness: 0.01,
						bevelSize: 0.01,
						bevelSegments: 10,
						curveSegments: 128,
						scale: 5,
						letterSpacing: -0.03,
						height: 0.25,
					}"
				>
					<ngts-mesh-transmission-material [options]="materialOptions()" />
				</ngts-text-3d>
			</ngts-center>
			<app-grid />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCenter, NgtsText3D, NgtsMeshTransmissionMaterial, Grid],
})
export class TextAndGrid {
	protected readonly fontGlyphs = fontGlyphs as unknown as NgtsFontInput;

	text = input('Angular');
	config = input({} as Partial<NgtsMeshTransmissionMaterialOptions>);

	protected texture = loaderResource(
		() => RGBELoader,
		() => 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
	);

	protected materialOptions = computed(() => ({ ...this.config(), background: this.texture.value() }));

	protected readonly Math = Math;
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['#f0f0f0']" attach="background" />
		<app-text-and-grid [text]="tweaks.text()" [config]="tweaks.materialConfig()" />

		<ngts-orbit-controls
			[options]="{
				autoRotate: tweaks.autoRotate(),
				autoRotateSpeed: -0.1,
				zoomSpeed: 0.25,
				minZoom: 40,
				maxZoom: 140,
				enablePan: false,
				dampingFactor: 0.05,
				minPolarAngle: Math.PI / 3,
				maxPolarAngle: Math.PI / 3,
			}"
		/>

		<ngts-environment [options]="{ resolution: 32 }">
			<ng-template>
				<ngt-group [rotation]="[-Math.PI / 4, -0.3, 0]">
					<ngts-lightformer
						[options]="{
							intensity: 20,
							rotation: [Math.PI / 2, 0, 0],
							position: [0, 5, -9],
							scale: [10, 10, 1],
						}"
					/>
					<ngts-lightformer
						[options]="{
							intensity: 2,
							rotation: [Math.PI / 2, 0, 0],
							position: [-10, 1, 5],
							scale: [10, 10, 1],
						}"
					/>
					<ngts-lightformer
						[options]="{
							intensity: 2,
							rotation: [0, Math.PI / 2, 0],
							position: [10, 1, 0],
							scale: [10, 10, 1],
						}"
					/>
					<ngts-lightformer
						[options]="{
							intensity: 2,
							rotation: [-Math.PI / 2, 0, 0],
							position: [-10, -1, -5],
							scale: [10, 10, 1],
						}"
					/>
					<ngts-lightformer
						[options]="{
							intensity: 2,
							rotation: [0, Math.PI / 2, 0],
							position: [-5, 1, -1],
							scale: [10, 2, 1],
						}"
					/>
				</ngt-group>
			</ng-template>
		</ngts-environment>

		<ngts-accumulative-shadows
			[options]="{
				temporal: false,
				frames: 100,
				color: tweaks.shadow(),
				colorBlend: 5,
				toneMapped: true,
				alphaTest: 0.9,
				opacity: 1,
				scale: 30,
				position: [0, -1.01, 0],
			}"
		>
			<ngts-randomized-lights
				[options]="{
					amount: 4,
					radius: 10,
					ambient: 0.5,
					position: [0, 10, -10],
					size: 15,
					intensity: Math.PI,
					bias: 0.0001,
					mapSize: 1024,
				}"
			/>
		</ngts-accumulative-shadows>

		<app-tweaks #tweaks />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtArgs,
		TextAndGrid,
		NgtsOrbitControls,
		NgtsEnvironment,
		NgtsLightformer,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		Tweaks,
	],
})
export class SceneGraph {
	protected readonly Math = Math;
}
