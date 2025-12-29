import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, signal } from '@angular/core';
import { is, NgtArgs, NgtThreeElements } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtsAccumulativeShadows, NgtsCenter, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import {
	TweakpaneCheckbox,
	TweakpaneFolder,
	TweakpaneList,
	TweakpaneNumber,
	TweakpanePane,
	TweakpanePoint,
} from 'angular-three-tweakpane';
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
	protected gltf = gltfResource<GLTF & { materials: { default: THREE.MeshStandardMaterial } }>(() => suziGLTF);

	protected scene = computed(() => {
		const gltf = this.gltf.value();
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
					frames: shadows.frame(),
					color: shadows.color(),
					colorBlend: shadows.colorBlend(),
					toneMapped: true,
					alphaTest: shadows.alphaTest(),
					opacity: 2,
					scale: 12,
				}"
			>
				<ngts-randomized-lights
					[options]="{
						intensity: lights.intensity(),
						amount: lights.amount(),
						radius: lights.radius(),
						ambient: lights.ambient(),
						position: lights.position(),
						bias: lights.bias(),
					}"
				/>
			</ngts-accumulative-shadows>
		</ngt-group>

		<ngts-orbit-controls [options]="{ minPolarAngle: 0, maxPolarAngle: Math.PI / 2 }" />
		<ngts-environment [options]="{ preset: 'city', background: background() }" />

		<tweakpane-pane title="Baking soft shadows controls" left="8px">
			<tweakpane-folder title="Environment">
				<tweakpane-checkbox [(value)]="background" label="Background" />
			</tweakpane-folder>
			<tweakpane-folder title="Shadows">
				<tweakpane-number
					[(value)]="shadows.frame"
					label="Frames"
					[params]="{
						options: [
							{ text: 'default', value: 100 },
							{ text: 'infinity', value: Inifinity },
						],
					}"
				/>
				<tweakpane-number
					[(value)]="shadows.alphaTest"
					label="alphaTest"
					[params]="{ min: 0, max: 1, step: 0.01 }"
				/>
				<tweakpane-list [(value)]="shadows.color" [options]="['#FFA500', '#97B2C2', '#E8888E']" label="Color" />
				<tweakpane-number
					[(value)]="shadows.colorBlend"
					[params]="{ min: 0, max: 5, step: 0.1 }"
					label="Color Blend"
				/>
				<tweakpane-checkbox [(value)]="shadows.toneMapped" label="toneMapped" />
				<tweakpane-number
					[(value)]="shadows.opacity"
					label="opacity"
					[params]="{ min: 0, max: 4, step: 0.05 }"
				/>
				<tweakpane-number [(value)]="shadows.scale" label="scale" [params]="{ min: 0, max: 20, step: 0.1 }" />
			</tweakpane-folder>
			<tweakpane-folder title="Shadows Lights">
				<tweakpane-number
					[(value)]="lights.intensity"
					label="intensity"
					[params]="{ min: 0, max: 10, step: 0.1 }"
				/>
				<tweakpane-number [(value)]="lights.amount" label="amount" [params]="{ min: 0, max: 10, step: 0.1 }" />
				<tweakpane-number [(value)]="lights.radius" label="radius" [params]="{ min: 0, max: 10, step: 0.1 }" />
				<tweakpane-number
					[(value)]="lights.ambient"
					label="ambient"
					[params]="{ min: 0, max: 1, step: 0.01 }"
				/>
				<tweakpane-number [(value)]="lights.bias" label="bias" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<tweakpane-point [(value)]="lights.position" label="position" />
			</tweakpane-folder>
		</tweakpane-pane>
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
		TweakpanePane,
		TweakpaneFolder,
		TweakpaneCheckbox,
		TweakpaneList,
		TweakpaneNumber,
		TweakpanePoint,
	],
})
export class SceneGraph {
	protected readonly Math = Math;
	protected readonly Inifinity = Infinity;

	protected background = signal(false);

	protected shadows = {
		frame: signal(100),
		color: signal('#FFA500'),
		colorBlend: signal(2),
		alphaTest: signal(0.75),
		toneMapped: signal(true),
		opacity: signal(2),
		scale: signal(12),
	};

	protected lights = {
		intensity: signal(Math.PI),
		amount: signal(8),
		radius: signal(4),
		ambient: signal(0.5),
		position: signal<[number, number, number]>([5, 5, -10]),
		bias: signal(0.001),
	};
}
