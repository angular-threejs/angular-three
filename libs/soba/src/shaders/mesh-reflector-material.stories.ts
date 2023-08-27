import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, signalStore } from 'angular-three';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { NgtsMeshReflectorMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

interface State {
	blur: [number, number];
	depthScale: number;
	distortion: number;
	normalScale: number;
	reflectorOffset: number;
}

@Component({
	selector: 'default-scene',
	standalone: true,
	template: `
		<ngt-mesh [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
			<ngt-plane-geometry *args="[10, 10]" />
			<ngts-mesh-reflector-material
				*ngIf="textures() as textures"
				color="#a0a0a0"
				[resolution]="1024"
				[mirror]="0.75"
				[mixBlur]="10"
				[mixStrength]="2"
				[blur]="sceneBlur()"
				[minDepthThreshold]="0.8"
				[maxDepthThreshold]="1.2"
				[depthScale]="sceneDepthScale()"
				[depthToBlurRatioBias]="0.2"
				[debug]="true"
				[distortion]="sceneDistortion()"
				[distortionMap]="textures.distortionMap"
				[metalness]="0.5"
				[roughnessMap]="textures.roughness"
				[roughness]="1"
				[normalMap]="textures.normal"
				[normalScale]="normalScaleVector()"
				[reflectorOffset]="sceneReflectorOffset()"
			/>
		</ngt-mesh>
		<ngt-mesh [position]="[0, 1.6, -3]">
			<ngt-box-geometry *args="[2, 3, 0.2]" />
			<ngt-mesh-physical-material color="hotpink" />
		</ngt-mesh>
		<ngt-mesh [position]="[0, 1, 0]" (beforeRender)="onBeforeRender($event.object, $event.state.clock)">
			<ngt-torus-knot-geometry *args="[0.5, 0.2, 128, 32]" />
			<ngt-mesh-physical-material color="hotpink" />
		</ngt-mesh>
		<ngt-spot-light [position]="[10, 6, 10]" [penumbra]="1" [angle]="0.3" />
		<ngts-environment preset="city" />
	`,
	imports: [NgtsMeshReflectorMaterial, NgtsEnvironment, NgtArgs, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Scene {
	Math = Math;

	private inputs = signalStore<State>();

	@Input() set blur(blur: [number, number]) {
		this.inputs.set({ blur });
	}

	@Input() set depthScale(depthScale: number) {
		this.inputs.set({ depthScale });
	}

	@Input() set distortion(distortion: number) {
		this.inputs.set({ distortion });
	}

	@Input() set normalScale(normalScale: number) {
		this.inputs.set({ normalScale });
	}

	@Input() set reflectorOffset(reflectorOffset: number) {
		this.inputs.set({ reflectorOffset });
	}

	textures = injectNgtsTextureLoader(() => ({
		roughness: 'soba/roughness_floor.jpeg',
		normal: 'soba/NORM.jpg',
		distortionMap: 'soba/dist_map.jpeg',
	}));

	sceneBlur = this.inputs.select('blur');
	sceneReflectorOffset = this.inputs.select('reflectorOffset');
	sceneDistortion = this.inputs.select('distortion');
	sceneDepthScale = this.inputs.select('depthScale');

	private _normalScale = this.inputs.select('normalScale');
	normalScaleVector = computed(() => new THREE.Vector2(this._normalScale() || 0));

	constructor() {
		effect(() => {
			const distortionMap = this.textures()?.distortionMap;
			if (!distortionMap) return;
			distortionMap.wrapS = distortionMap.wrapT = THREE.RepeatWrapping;
			distortionMap.repeat.set(4, 4);
		});
	}

	onBeforeRender(torus: THREE.Mesh, clock: THREE.Clock) {
		torus.position.y += Math.sin(clock.getElapsedTime()) / 25;
		torus.rotation.y = clock.getElapsedTime() / 2;
	}
}

@Component({
	standalone: true,
	template: `
		<default-scene [reflectorOffset]="1" />
	`,
	imports: [Scene],
})
class OffsetMeshReflectorMaterialStory {}

@Component({
	standalone: true,
	template: `
		<default-scene [normalScale]="0.5" />
	`,
	imports: [Scene],
})
class NormalMapMeshReflectorMaterialStory {}

@Component({
	standalone: true,
	template: `
		<default-scene [distortion]="1" />
	`,
	imports: [Scene],
})
class DistortionMeshReflectorMaterialStory {}

@Component({
	standalone: true,
	template: `
		<default-scene [depthScale]="2" />
	`,
	imports: [Scene],
})
class DepthMeshReflectorMaterialStory {}

@Component({
	standalone: true,
	template: `
		<default-scene [blur]="[500, 500]" />
	`,
	imports: [Scene],
})
class BlurMeshReflectorMaterialStory {}

@Component({
	standalone: true,
	template: `
		<default-scene />
	`,
	imports: [Scene],
})
class PlainMeshReflectorMaterialStory {}

@Component({
	standalone: true,
	template: `
		<default-scene [blur]="[100, 500]" [depthScale]="2" [distortion]="0.3" [normalScale]="0.5" />
	`,
	imports: [Scene],
})
class DefaultMeshReflectorMaterialStory {}

export default {
	title: 'Shaders/MeshReflectorMaterial',
	decorators: makeDecorators(),
} as Meta;

const canvasOptions = { camera: { fov: 20, position: [-6, 6, 15] } };

export const Default = makeStoryFunction(DefaultMeshReflectorMaterialStory, canvasOptions);
export const Plain = makeStoryFunction(PlainMeshReflectorMaterialStory, canvasOptions);
export const Blur = makeStoryFunction(BlurMeshReflectorMaterialStory, canvasOptions);
export const Depth = makeStoryFunction(DepthMeshReflectorMaterialStory, canvasOptions);
export const Distortion = makeStoryFunction(DistortionMeshReflectorMaterialStory, canvasOptions);
export const NormalMap = makeStoryFunction(NormalMapMeshReflectorMaterialStory, canvasOptions);
export const Offset = makeStoryFunction(OffsetMeshReflectorMaterialStory, canvasOptions);
