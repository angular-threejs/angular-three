import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { injectTexture } from 'angular-three-soba/loaders';
import { NgtsMeshReflectorMaterial, NgtsMeshReflectorMaterialOptions } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Mesh, RepeatWrapping, Vector2 } from 'three';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

const defaultOptions: Partial<NgtsMeshReflectorMaterialOptions> = {
	resolution: 1024,
	mirror: 0.75,
	mixBlur: 10,
	mixStrength: 2,
	minDepthThreshold: 0.8,
	maxDepthThreshold: 1.2,
	depthToBlurRatioBias: 0.2,
	color: '#a0a0a0',
	metalness: 0.5,
	roughness: 1,
	blur: [0, 0],
	depthScale: 0,
	distortion: 0,
	normalScale: new Vector2(0, 0),
};

@Component({
	standalone: true,
	template: `
		<ngt-mesh [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
			<ngt-plane-geometry *args="[10, 10]" />
			<ngts-mesh-reflector-material [options]="reflectorOptions()" />
		</ngt-mesh>

		<ngt-mesh [position]="[0, 1.6, -3]">
			<ngt-box-geometry *args="[2, 3, 0.2]" />
			<ngt-mesh-physical-material color="hotpink" />
		</ngt-mesh>

		<ngt-mesh #mesh [position]="[0, 1, 0]">
			<ngt-torus-knot-geometry *args="[0.5, 0.2, 128, 32]" />
			<ngt-mesh-physical-material color="hotpink" />
		</ngt-mesh>

		<ngt-spot-light [intensity]="Math.PI" [decay]="0" [position]="[10, 6, 10]" [penumbra]="1" [angle]="0.3" />
		<ngts-environment [options]="{ preset: 'city' }" />
	`,
	imports: [NgtsMeshReflectorMaterial, NgtArgs, NgtsEnvironment],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class MeshReflectorMaterialStory {
	protected readonly Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private textures = injectTexture(() => ({
		roughnessMap: 'roughness_floor.jpeg',
		normalMap: 'NORM.jpg',
		distortionMap: 'dist_map.jpeg',
	}));

	reflectorOptions = computed(() => {
		const options = this.options();
		const textures = this.textures();
		if (!textures) return options;
		return { ...options, ...textures };
	});

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const distortionMap = this.textures()?.distortionMap;
				if (!distortionMap) return;
				distortionMap.wrapS = distortionMap.wrapT = RepeatWrapping;
				distortionMap.repeat.set(4, 4);
			});
		});

		injectBeforeRender(({ clock }) => {
			const mesh = this.mesh().nativeElement;
			mesh.position.y += Math.sin(clock.getElapsedTime()) / 25;
			mesh.rotation.y = clock.getElapsedTime() / 2;
		});
	}
}

export default {
	title: 'Materials/MeshReflectorMaterial',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(MeshReflectorMaterialStory, {
	canvasOptions: { camera: { position: [-2, 2, 6], fov: 20 } },
});

export const Blur = makeStoryObject(MeshReflectorMaterialStory, {
	canvasOptions: { camera: { position: [-2, 2, 6], fov: 20 } },
	argsOptions: {
		options: { blur: 500 },
	},
});

export const Depth = makeStoryObject(MeshReflectorMaterialStory, {
	canvasOptions: { camera: { position: [-2, 2, 6], fov: 20 } },
	argsOptions: {
		options: { depthScale: 2 },
	},
});

export const Distortion = makeStoryObject(MeshReflectorMaterialStory, {
	canvasOptions: { camera: { position: [-2, 2, 6], fov: 20 } },
	argsOptions: {
		options: { distortion: 1 },
	},
});

export const NormalMap = makeStoryObject(MeshReflectorMaterialStory, {
	canvasOptions: { camera: { position: [-2, 2, 6], fov: 20 } },
	argsOptions: {
		options: { normalScale: new Vector2(1, 1) },
	},
});

export const Offset = makeStoryObject(MeshReflectorMaterialStory, {
	canvasOptions: { camera: { position: [-2, 2, 6], fov: 20 } },
	argsOptions: {
		options: { reflectorOffset: 1 },
	},
});
