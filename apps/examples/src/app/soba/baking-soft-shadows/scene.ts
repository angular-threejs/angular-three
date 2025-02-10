import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { is, NgtArgs, NgtThreeElements } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsAccumulativeShadows, NgtsCenter, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { FlakesTexture, GLTF } from 'three-stdlib';
import suziGLTF from './suzi.gltf';

@Component({
	selector: 'app-suzi',
	template: `
		<ngt-primitive *args="[scene()]" [parameters]="options()" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Suzi {
	options = input<Partial<NgtThreeElements['ngt-group']>>({});
	protected gltf = injectGLTF<GLTF & { materials: { default: THREE.MeshStandardMaterial } }>(() => suziGLTF);

	protected scene = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;

		const { scene, materials } = gltf;

		scene.traverse((obj) => {
			if (is.three<THREE.Mesh>(obj, 'isMesh')) {
				obj.receiveShadow = obj.castShadow = true;
			}
		});

		materials.default.color.set('orange');
		materials.default.roughness = 0;
		materials.default.normalMap = new THREE.CanvasTexture(
			// @ts-expect-error - three-stdlib type
			new FlakesTexture(),
			THREE.UVMapping,
			THREE.RepeatWrapping,
			THREE.RepeatWrapping,
		);
		materials.default.normalMap.repeat.set(40, 40);
		materials.default.normalScale.set(0.1, 0.1);

		return scene;
	});
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['goldenrod']" attach="background" />

		<ngt-group [position]="[0, -0.5, 0]">
			<ngts-center [options]="{ top: true }">
				<app-suzi [options]="{ rotation: [-0.63, 0, 0], scale: 2 }" />
			</ngts-center>

			<ngts-center [options]="{ top: true, position: [-2, 0, 1] }">
				<ngt-mesh castShadow>
					<ngt-sphere-geometry *args="[0.25, 64, 64]" />
					<ngt-mesh-standard-material color="lightblue" />
				</ngt-mesh>
			</ngts-center>

			<ngts-center [options]="{ top: true, position: [2.5, 0, 1] }">
				<ngt-mesh castShadow [rotation]="[0, Math.PI / 4, 0]">
					<ngt-box-geometry *args="[0.5, 0.5, 0.5]" />
					<ngt-mesh-standard-material color="indianred" />
				</ngt-mesh>
			</ngts-center>

			<ngts-accumulative-shadows
				[options]="{
					temporal: true,
					frames: 100,
					color: 'orange',
					colorBlend: 2,
					toneMapped: true,
					alphaTest: 0.75,
					opacity: 2,
					scale: 12,
				}"
			>
				<ngts-randomized-lights
					[options]="{
						intensity: Math.PI,
						amount: 8,
						radius: 4,
						ambient: 0.5,
						position: [5, 5, -10],
						bias: 0.001,
					}"
				/>
			</ngts-accumulative-shadows>
		</ngt-group>

		<ngts-orbit-controls [options]="{ minPolarAngle: 0, maxPolarAngle: Math.PI / 2 }" />
		<ngts-environment [options]="{ preset: 'city' }" />
	`,

	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtsEnvironment,
		NgtsOrbitControls,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsCenter,
		NgtArgs,
		Suzi,
	],
})
export class SceneGraph {
	protected readonly Math = Math;
}
