import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectLoader, NgtArgs } from 'angular-three';
import { NgtsCameraContent, NgtsCubeCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import {
	NgtsMeshRefractionMaterial,
	NgtsMeshRefractionMaterialOptions,
	NgtsMeshTransmissionMaterial,
} from 'angular-three-soba/materials';
import {
	NgtsAccumulativeShadows,
	NgtsCaustics,
	NgtsCausticsOptions,
	NgtsEnvironment,
	NgtsRandomizedLights,
} from 'angular-three-soba/staging';
import { RGBELoader } from 'three-stdlib';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

injectLoader.preload(
	() => RGBELoader,
	() => 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
);

@Component({
	selector: 'diamond-flat',
	standalone: true,
	template: `
		@if (texture(); as envMap) {
			<ngts-cube-camera [options]="{ envMap, frames: 1, resolution: 256 }">
				<ng-template cameraContent let-cameraTexture>
					@if (gltf(); as gltf) {
						<ngts-caustics
							[options]="{
								backside: true,
								color: 'white',
								position: [0, -0.5, 0],
								lightSource: lightSource(),
								worldRadius: 0.1,
								ior: 1.8,
								backsideIOR: 1.1,
								intensity: 0.1,
							}"
						>
							<ngt-mesh
								[castShadow]="true"
								[geometry]="gltf.nodes.Diamond_1_0.geometry"
								[rotation]="rotation()"
								[position]="position()"
							>
								<ngts-mesh-refraction-material [options]="options()" [envMap]="cameraTexture()" />
							</ngt-mesh>
						</ngts-caustics>
					}
				</ng-template>
			</ngts-cube-camera>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCubeCamera, NgtsCameraContent, NgtsCaustics, NgtsMeshRefractionMaterial],
})
class Diamond {
	rotation = input([0, 0, 0]);
	position = input([0, 0, 0]);
	lightSource = input<NgtsCausticsOptions['lightSource']>();
	options = input({} as NgtsMeshRefractionMaterialOptions);

	gltf = injectGLTF(() => './dflat.glb') as Signal<any | null>;
	texture = injectLoader(
		() => RGBELoader,
		() => 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
	);
}

@Component({
	standalone: true,
	template: `
		<ngt-ambient-light [intensity]="0.5" />
		<ngt-spot-light #spotLight [position]="[5, 5, -10]" [angle]="0.15" [penumbra]="1" />
		<ngt-point-light [position]="[-10, -10, -10]" />

		<diamond-flat
			[lightSource]="spotLight"
			[rotation]="[0, 0, 0.715]"
			[position]="[0, -0.175 + 0.5, 0]"
			[options]="options()"
		/>

		<ngts-caustics
			[options]="{
				position: [0, -0.5, 0],
				lightSource: spotLight,
				color: '#FF8F20',
				worldRadius: 0.003,
				ior: 1.16,
				intensity: 0.004,
			}"
		>
			<ngt-mesh [castShadow]="true" [receiveShadow]="true" [position]="[-2, 0.5, -1]" [scale]="0.5">
				<ngt-sphere-geometry *args="[1, 64, 64]" />
				<ngts-mesh-transmission-material
					[options]="{ resolution: 1024, distortion: 0.25, color: '#FF8F20', thickness: 1, anisotropy: 1 }"
				/>
			</ngt-mesh>
		</ngts-caustics>

		<ngt-mesh [castShadow]="true" [receiveShadow]="true" [position]="[1.75, 0.25, 1]" [scale]="0.75">
			<ngt-sphere-geometry *args="[1, 64, 64]" />
			<ngt-mesh-standard-material color="hotpink" />
		</ngt-mesh>

		<ngts-accumulative-shadows
			[options]="{
				temporal: true,
				frames: 100,
				position: [0, -0.5, 0],
				color: 'orange',
				colorBlend: 2,
				toneMapped: true,
				alphaTest: 0.7,
				opacity: 1,
				scale: 12,
			}"
		>
			<ngts-randomized-lights [options]="{ position: [5, 5, -10], amount: 8, radius: 10, ambient: 0.5, bias: 0.001 }" />
		</ngts-accumulative-shadows>

		<ngts-environment
			[options]="{
				files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
			}"
		/>
		<ngts-orbit-controls
			[options]="{
				makeDefault: true,
				autoRotate: true,
				autoRotateSpeed: 0.1,
				minPolarAngle: 0,
				maxPolarAngle: Math.PI / 2,
			}"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		Diamond,
		NgtsCaustics,
		NgtArgs,
		NgtsMeshTransmissionMaterial,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsEnvironment,
		NgtsOrbitControls,
	],
})
class DefaultRefractionStory {
	protected readonly Math = Math;

	options = input({} as NgtsMeshRefractionMaterialOptions);
}

export default {
	title: 'Materials/MeshRefractionMaterial',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultRefractionStory, {
	canvasOptions: { camera: { position: [-5, 0.5, 5], fov: 45 }, background: '#f0f0f0', controls: false },
	argsOptions: {
		options: {
			bounces: 3,
			aberrationStrength: 0.01,
			ior: 2.75,
			fresnel: 1,
			fastChroma: true,
			toneMapped: false,
		},
	},
});
