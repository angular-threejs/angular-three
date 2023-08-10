import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectNgtLoader, injectNgtStore, NgtArgs } from 'angular-three';
import { NgtsCubeCamera, NgtsCubeCameraContent } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader } from 'angular-three-soba/loaders';
import { NgtsMeshRefractionMaterial, NgtsMeshTranmissionMaterial } from 'angular-three-soba/materials';
import { NgtsCaustics } from 'angular-three-soba/misc';
import { NgtsAccumulativeShadows, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import { RGBELoader } from 'three-stdlib';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	selector: 'Diamond',
	standalone: true,
	template: `
		<ngts-cube-camera [resolution]="256" [frames]="1" [envMap]="cameraTexture()">
			<ngts-caustics
				*ngtsCubeCameraContent="true; texture as texture"
				color="white"
				[backside]="true"
				[position]="[0, -0.5, 0]"
				[lightSource]="[5, 5, -10]"
				[worldRadius]="0.1"
				[ior]="1.8"
				[backsideIOR]="1.1"
				[intensity]="0.1"
			>
				<ngt-mesh
					*ngIf="diamondGeometry() as diamondGeometry"
					[castShadow]="true"
					[geometry]="diamondGeometry"
					[rotation]="[0, 0, 0.715]"
					[position]="[0, -0.175 + 0.5, 0]"
				>
					<ngts-mesh-refraction-material
						[envMap]="texture()"
						[bounces]="3"
						[aberrationStrength]="0.01"
						[ior]="2.75"
						[fresnel]="1"
						[fastChroma]="true"
						[toneMapped]="false"
					/>
				</ngt-mesh>
			</ngts-caustics>
		</ngts-cube-camera>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtsCubeCamera, NgtsCaustics, NgtsCubeCameraContent, NgtsMeshRefractionMaterial, NgIf],
})
class Diamond {
	cameraTexture = injectNgtLoader(
		() => RGBELoader,
		() => 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
	);
	private diamondGltf = injectNgtsGLTFLoader(() => 'soba/dflat.glb');
	diamondGeometry = computed(() => {
		const diamond = this.diamondGltf();
		if (!diamond) return null;
		return (diamond.nodes['Diamond_1_0'] as THREE.Mesh).geometry;
	});

	store = injectNgtStore();

	constructor() {
		console.log(this.store.get('scene'));
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#f0f0f0']" />
		<ngt-ambient-light [intensity]="0.5" />
		<ngt-spot-light [position]="[5, 5, -10]" [angle]="0.15" [penumbra]="1" />
		<ngt-point-light [position]="-10" />

		<ngts-caustics
			color="#FF8F20"
			[position]="[0, -0.5, 0]"
			[lightSource]="[5, 5, -10]"
			[worldRadius]="0.003"
			[ior]="1.16"
			[intensity]="0.004"
		>
			<ngt-mesh [castShadow]="true" [receiveShadow]="true" [position]="[-2, 0.5, -1]" [scale]="0.5">
				<ngt-sphere-geometry *args="[1, 64, 64]" />
				<ngts-mesh-transmission-material
					color="#FF8F20"
					[resolution]="1024"
					[distortion]="0.25"
					[thickness]="1"
					[anisotropy]="1"
				/>
			</ngt-mesh>
		</ngts-caustics>

		<Diamond />

		<ngt-mesh [castShadow]="true" [receiveShadow]="true" [position]="[1.75, 0.25, 1]" [scale]="0.75">
			<ngt-sphere-geometry *args="[1, 64, 64]" />
			<ngt-mesh-standard-material color="hotpink" />
		</ngt-mesh>

		<ngts-accumulative-shadows
			[temporal]="true"
			[frame]="100"
			color="orange"
			[colorBlend]="2"
			[toneMapped]="true"
			[alphaTest]="0.8"
			[opacity]="1"
			[scale]="12"
			[position]="[0, -0.5, 0]"
		>
			<ngts-randomized-lights
				[amount]="8"
				[radius]="10"
				[intensity]="1"
				[ambient]="0.5"
				[position]="[5, 5, -10]"
				[bias]="0.001"
			/>
		</ngts-accumulative-shadows>

		<ngts-environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr" />

		<ngts-orbit-controls
			[makeDefault]="true"
			[autoRotate]="true"
			[autoRotateSpeed]="1"
			[minPolarAngle]="0"
			[maxPolarAngle]="Math.PI / 2"
		/>
	`,
	imports: [
		Diamond,
		NgIf,
		NgtArgs,
		NgtsMeshTranmissionMaterial,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsEnvironment,
		NgtsOrbitControls,
		NgtsCaustics,
	],
	schemas: [NO_ERRORS_SCHEMA],
})
class DefaultMeshRefractionMaterialStory {
	Math = Math;
}

export default {
	title: 'Shaders/MeshRefractionMaterial',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultMeshRefractionMaterialStory, {
	camera: { fov: 45, position: [-5, 0.5, 0] },
	useLegacyLights: true,
});
