import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba-old/loaders';
import { NgtsMeshTranmissionMaterial } from 'angular-three-soba-old/materials';
import {
	NgtsAccumulativeShadows,
	NgtsCenter,
	NgtsEnvironment,
	NgtsRandomizedLights,
} from 'angular-three-soba-old/staging';
import * as THREE from 'three';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

// https://sketchfab.com/3d-models/gelatinous-cube-e08385238f4d4b59b012233a9fbdca21
@Component({
	selector: 'transmission-gelatinous-cube',
	standalone: true,
	template: `
		<ngt-group *ngIf="cubeGLTF() as cubeGLTF" [dispose]="null">
			<ngt-mesh [geometry]="cubeGLTF.nodes.cube1.geometry" [position]="[-0.56, 0.38, -0.11]">
				<ngts-mesh-transmission-material
					[background]="background"
					[backside]="false"
					[samples]="10"
					[resolution]="2048"
					[transmission]="1"
					[roughness]="0"
					[thickness]="3.5"
					[ior]="1.5"
					[chromaticAberration]="0.06"
					[anisotropy]="0.1"
					[distortion]="0.0"
					[distortionScale]="0.3"
					[temporalDistortion]="0.5"
					[clearcoat]="1"
					[attenuationDistance]="0.5"
					attenuationColor="#ffffff"
					color="#c9ffa1"
				/>
			</ngt-mesh>
			<ngt-mesh
				[castShadow]="true"
				[renderOrder]="-100"
				[geometry]="cubeGLTF.nodes.cube2.geometry"
				[material]="cubeGLTF.materials.cube_mat"
				[position]="[-0.56, 0.38, -0.11]"
			>
				<ngt-value [rawValue]="FrontSide" attach="material.side" />
			</ngt-mesh>
			<ngt-mesh
				[geometry]="cubeGLTF.nodes.bubbles.geometry"
				[material]="cubeGLTF.materials.cube_bubbles_mat"
				[position]="[-0.56, 0.38, -0.11]"
			/>
			<ngt-group [position]="[-0.56, 0.38, -0.41]">
				<ngt-mesh [geometry]="cubeGLTF.nodes.arrows.geometry" [material]="cubeGLTF.materials.weapons_mat" />
				<ngt-mesh [geometry]="cubeGLTF.nodes.skeleton_1.geometry" [material]="cubeGLTF.materials.skele_mat" />
				<ngt-mesh [geometry]="cubeGLTF.nodes.skeleton_2.geometry" [material]="cubeGLTF.materials.weapons_mat">
					<ngt-value [rawValue]="FrontSide" attach="material.side" />
				</ngt-mesh>
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgIf, NgtsMeshTranmissionMaterial],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class GelatinousCube {
	FrontSide = THREE.FrontSide;
	background = new THREE.Color('#839681');
	cubeGLTF = injectNgtsGLTFLoader(() => 'soba/gelatinous_cube.glb');
}

@Component({
	standalone: true,
	template: `
		<ngt-ambient-light />
		<ngt-group [position]="[0, -2.5, 0]">
			<ngts-center [top]="true">
				<transmission-gelatinous-cube />
			</ngts-center>
			<ngts-accumulative-shadows
				[temporal]="true"
				[frames]="100"
				[alphaTest]="0.9"
				[colorBlend]="1"
				[opacity]="0.8"
				[scale]="20"
				color="#3ead5d"
			>
				<ngts-randomized-lights
					[radius]="10"
					[ambient]="0.5"
					[intensity]="Math.PI"
					[position]="[2.5, 8, -2.5]"
					[bias]="0.001"
				/>
			</ngts-accumulative-shadows>
		</ngt-group>
		<ngts-orbit-controls
			[minPolarAngle]="0"
			[maxPolarAngle]="Math.PI / 2"
			[autoRotate]="true"
			[autoRotateSpeed]="0.05"
			[makeDefault]="true"
		/>
		<ngts-environment
			files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr"
			[background]="true"
			[blur]="1"
		/>
	`,
	imports: [
		GelatinousCube,
		NgtsCenter,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsOrbitControls,
		NgtsEnvironment,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultMeshTransmissionMaterialStory {
	Math = Math;
}

export default {
	title: 'Shaders/MeshTransmissionMaterial',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({ camera: { fov: 25, position: [15, 0, 15] } });

export const Default = makeStoryFunction(DefaultMeshTransmissionMaterialStory, canvasOptions);
