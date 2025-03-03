import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';
import { injectLoader, NgtArgs } from 'angular-three';
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

import {
	NgtTweakCheckbox,
	NgtTweakColor,
	NgtTweakFolder,
	NgtTweakNumber,
	NgtTweakPane,
	NgtTweakText,
} from 'angular-three-tweakpane';
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

	protected texture = injectLoader(
		() => RGBELoader,
		() => 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
	);

	protected materialOptions = computed(() => ({
		...this.config(),
		background: this.texture(),
	}));

	protected readonly Math = Math;
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['#f0f0f0']" attach="background" />
		<app-text-and-grid [text]="text()" [config]="materialConfig()" />

		<ngts-orbit-controls
			[options]="{
				autoRotate: autoRotate(),
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
			<ngt-group * [rotation]="[-Math.PI / 4, -0.3, 0]">
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
		</ngts-environment>

		<ngts-accumulative-shadows
			[options]="{
				temporal: false,
				frames: 100,
				color: shadow(),
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

		<ngt-tweak-pane title="Epoxy Resin" left="8px">
			<ngt-tweak-text [(value)]="text" label="text" />
			<ngt-tweak-color [(value)]="shadow" label="Shadow Color" />
			<ngt-tweak-checkbox [(value)]="autoRotate" label="Auto Rotate" />
			<ngt-tweak-folder title="Text Material">
				<ngt-tweak-checkbox [(value)]="backside" label="Backside" />
				<ngt-tweak-number
					[(value)]="backsideThickness"
					label="Backside Thickness"
					[params]="{ min: 0, max: 2 }"
				/>
				<ngt-tweak-number [(value)]="samples" label="Samples" [params]="{ min: 1, max: 32, step: 1 }" />
				<ngt-tweak-number
					[(value)]="resolution"
					label="Resolution"
					[params]="{ min: 64, max: 2048, step: 64 }"
				/>
				<ngt-tweak-number [(value)]="transmission" label="Transmission" [params]="{ min: 0, max: 1 }" />
				<ngt-tweak-number [(value)]="clearcoat" label="Clearcoat" [params]="{ min: 0.1, max: 1 }" />
				<ngt-tweak-number
					[(value)]="clearcoatRoughness"
					label="Clearcoat Roughness"
					[params]="{ min: 0, max: 1 }"
				/>
				<ngt-tweak-number [(value)]="thickness" label="Thickness" [params]="{ min: 0, max: 5 }" />
				<ngt-tweak-number
					[(value)]="chromaticAberration"
					label="Chromatic Aberration"
					[params]="{ min: 0, max: 5 }"
				/>
				<ngt-tweak-number [(value)]="anisotropy" label="Anisotropy" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<ngt-tweak-number [(value)]="roughness" label="Roughness" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<ngt-tweak-number [(value)]="distortion" label="Distortion" [params]="{ min: 0, max: 4, step: 0.01 }" />
				<ngt-tweak-number
					[(value)]="distortionScale"
					label="Distortion Scale"
					[params]="{ min: 0.01, max: 1, step: 0.01 }"
				/>
				<ngt-tweak-number
					[(value)]="temporalDistortion"
					label="Temporal Distortion"
					[params]="{ min: 0, max: 1, step: 0.01 }"
				/>
				<ngt-tweak-number [(value)]="ior" label="IOR" [params]="{ min: 0, max: 2, step: 0.01 }" />
				<ngt-tweak-color [(value)]="color" label="Color" />
			</ngt-tweak-folder>
		</ngt-tweak-pane>
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
		NgtTweakPane,
		NgtTweakText,
		NgtTweakFolder,
		NgtTweakCheckbox,
		NgtTweakNumber,
		NgtTweakColor,
	],
})
export class SceneGraph {
	protected readonly Math = Math;

	protected text = signal('Angular');
	protected backside = signal(true);
	protected backsideThickness = signal(0.3);
	protected samples = signal(16);
	protected resolution = signal(1024);
	protected transmission = signal(1);
	protected clearcoat = signal(0);
	protected clearcoatRoughness = signal(0.0);
	protected thickness = signal(0.3);
	protected chromaticAberration = signal(5);
	protected anisotropy = signal(0.3);
	protected roughness = signal(0);
	protected distortion = signal(0.5);
	protected distortionScale = signal(0.1);
	protected temporalDistortion = signal(0);
	protected ior = signal(1.5);
	protected color = signal('#ff9cf5');
	protected shadow = signal('#750d57');
	protected autoRotate = signal(false);

	protected materialConfig = computed(() => ({
		color: this.color(),
		roughness: this.roughness(),
		transmission: this.transmission(),
		thickness: this.thickness(),
		ior: this.ior(),
		clearcoat: this.clearcoat(),
		clearcoatRoughness: this.clearcoatRoughness(),
		anisotropy: this.anisotropy(),
		chromaticAberration: this.chromaticAberration(),
		distortion: this.distortion(),
		distortionScale: this.distortionScale(),
		temporalDistortion: this.temporalDistortion(),
		backside: this.backside(),
		backsideThickness: this.backsideThickness(),
		samples: this.samples(),
		resolution: this.resolution(),
	}));
}
