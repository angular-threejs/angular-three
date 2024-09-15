import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, signal, Signal } from '@angular/core';
import { NgtArgs, NgtEuler, NgtVector3 } from 'angular-three';
import { NgtpDepthOfField, NgtpEffectComposer, NgtpToneMapping } from 'angular-three-postprocessing';
import { NgtpN8AO } from 'angular-three-postprocessing/n8ao';
import { NgtrCuboidCollider, NgtrInstancedRigidBodies, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import {
	NgtsAccumulativeShadows,
	NgtsEnvironment,
	NgtsLightformer,
	NgtsRandomizedLights,
} from 'angular-three-soba/staging';
import { MathUtils, Mesh, MeshStandardMaterial } from 'three';
import { GLTF } from 'three-stdlib';

export const debug = signal(false);

type HatGLTF = GLTF & {
	nodes: { Plane006: Mesh; Plane006_1: Mesh };
	materials: { Material: MeshStandardMaterial; boxCap: MeshStandardMaterial };
};

@Component({
	selector: 'app-hats',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-object3D [ngtrInstancedRigidBodies]="instances" [options]="{ colliders: 'hull' }">
				<ngt-instanced-mesh
					*args="[gltf.nodes.Plane006_1.geometry, gltf.materials.boxCap, 80]"
					[dispose]="null"
					[receiveShadow]="true"
					[castShadow]="true"
				/>
			</ngt-object3D>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrInstancedRigidBodies, NgtArgs],
})
export class Hats {
	protected gltf = injectGLTF(() => './blender-threejs-journey-20k-hat-transformed.glb') as Signal<HatGLTF | null>;

	protected instances = Array.from({ length: 80 }, (_, index) => ({
		key: index,
		position: [MathUtils.randFloatSpread(2) + 1, 10 + index / 2, MathUtils.randFloatSpread(2) - 2] as NgtVector3,
		rotation: [Math.random(), Math.random(), Math.random()] as NgtEuler,
	}));

	// NOTE: GLTF of the hat has 2 parts: the cap and the tassel. InstancedMesh
	//  can only have 1 geometry, so we need something like CSG to merge the geometries into one.
	//  Angular Three does not have this yet.
	//         <Geometry useGroups>
	//           <Base geometry={nodes.Plane006.geometry} material={materials.Material} />
	//           <Addition geometry={nodes.Plane006_1.geometry} material={materials.boxCap} />
	//         </Geometry>
}

type ModelGLTF = GLTF & {
	nodes: { boxBase: Mesh; boxBack: Mesh; Text: Mesh };
	materials: { boxBase: MeshStandardMaterial; inside: MeshStandardMaterial };
};

@Component({
	selector: 'app-model',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-group [position]="position()" [dispose]="null">
				<ngt-object3D ngtrRigidBody="fixed" [options]="{ colliders: 'trimesh' }">
					<ngt-mesh
						[castShadow]="true"
						[receiveShadow]="true"
						[geometry]="gltf.nodes.boxBase.geometry"
						[material]="gltf.materials.boxBase"
					/>
					<ngt-mesh
						[receiveShadow]="true"
						[geometry]="gltf.nodes.boxBack.geometry"
						[material]="gltf.materials.inside"
					/>
					<ngt-mesh
						[castShadow]="true"
						[receiveShadow]="true"
						[geometry]="gltf.nodes.Text.geometry"
						[material]="gltf.materials.boxBase"
					/>
				</ngt-object3D>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class Model {
	position = input<NgtVector3>([0, 0, 0]);

	protected gltf = injectGLTF(() => './blender-threejs-journey-20k-transformed.glb') as Signal<ModelGLTF | null>;
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#f0f0f0']" />
		<ngt-ambient-light [intensity]="0.5" />
		<ngt-directional-light [position]="[-10, 10, 5]" [castShadow]="true">
			<ngt-value [rawValue]="-0.0001" attach="shadow.bias" />
			<ngt-vector2 *args="[256, 256]" attach="shadow.mapSize" />
			<ngt-orthographic-camera *args="[-10, 10, -10, 10]" attach="shadow.camera" />
		</ngt-directional-light>

		<ngts-environment [options]="{ resolution: 32 }">
			<ng-template>
				<ngts-lightformer [options]="{ position: [10, 10, 10], scale: 10, intensity: 4 }" />
				<ngts-lightformer [options]="{ position: [10, 0, -10], scale: 10, color: 'red', intensity: 6 }" />
				<ngts-lightformer [options]="{ position: [-10, -10, -10], scale: 10, intensity: 4 }" />
			</ng-template>
		</ngts-environment>

		<ngtr-physics [options]="{ debug: debug(), gravity: [0, -4, 0] }">
			<app-model [position]="[1, 0, -1.5]" />
			<app-hats />
			<ngt-object3D ngtrRigidBody="fixed" [options]="{ colliders: false }" [position]="[0, -1, 0]">
				<ngt-object3D ngtrCuboidCollider [args]="[1000, 1, 1000]" />
			</ngt-object3D>
		</ngtr-physics>

		<ngts-accumulative-shadows
			[options]="{
				temporal: true,
				frames: Infinity,
				alphaTest: 1,
				blend: 200,
				limit: 1500,
				scale: 25,
				position: [0, -0.05, 0],
			}"
		>
			<ngts-randomized-lights
				[options]="{ amount: 1, mapSize: 512, radius: 5, ambient: 0.5, position: [-10, 10, 5], size: 10, bias: 0.001 }"
			/>
		</ngts-accumulative-shadows>

		<ngtp-effect-composer>
			<ngtp-n8ao [options]="{ aoRadius: 0.5, intensity: 1 }" />
			<ngtp-depth-of-field [options]="{ target: [0, 0, -2.5], focusRange: 0.1, bokehScale: 10 }" />
			<ngtp-tone-mapping />
		</ngtp-effect-composer>

		<ngts-orbit-controls
			[options]="{
				autoRotate: true,
				autoRotateSpeed: 0.1,
				enablePan: false,
				enableZoom: false,
				minPolarAngle: Math.PI / 4,
				maxPolarAngle: Math.PI / 4,
			}"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'bruno-simons-2k-soba-experience' },
	imports: [
		NgtArgs,
		NgtsEnvironment,
		NgtsLightformer,
		NgtrPhysics,
		Model,
		NgtrRigidBody,
		NgtrCuboidCollider,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtpEffectComposer,
		NgtpN8AO,
		NgtpDepthOfField,
		NgtsOrbitControls,
		NgtpToneMapping,
		Hats,
	],
})
export class Experience {
	protected readonly Infinity = Infinity;
	protected readonly Math = Math;

	protected debug = debug;
}
