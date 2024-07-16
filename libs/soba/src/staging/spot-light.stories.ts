import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectTexture } from 'angular-three-soba/loaders';
import { injectDepthBuffer } from 'angular-three-soba/misc';
import { NgtsEnvironment, NgtsSpotLight, NgtsSpotLightOptions, NgtsSpotLightShadow } from 'angular-three-soba/staging';
import { MathUtils, RepeatWrapping } from 'three';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-orbit-controls
			[options]="{ makeDefault: true, autoRotate: true, autoRotateSpeed: 0.5, minDistance: 2, maxDistance: 10 }"
		/>
		<ngts-perspective-camera [options]="{ makeDefault: true, near: 0.01, far: 50, position: [1, 3, 1], fov: 60 }" />
		<ngts-environment [options]="{ preset: 'sunset' }" />

		<ngt-hemisphere-light *args="['#ffffbb', '#080820', Math.PI]" />

		<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]" [receiveShadow]="true">
			<ngt-circle-geometry *args="[5, 64, 64]" />
			<ngt-mesh-standard-material
				[map]="textures()?.diffuse"
				[normalMap]="textures()?.normal"
				[roughnessMap]="textures()?.roughness"
				[aoMap]="textures()?.ao"
				[envMapIntensity]="0.2"
			/>
		</ngt-mesh>

		<ngts-spot-light [options]="options()">
			<ngts-spot-light-shadow
				[shader]="shader()"
				[options]="{ scale: 4, distance: 0.4, width: 2048, height: 2048, map: leafTexture() }"
			/>
		</ngts-spot-light>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsOrbitControls, NgtsPerspectiveCamera, NgtsEnvironment, NgtArgs, NgtsSpotLight, NgtsSpotLightShadow],
})
class SpotLightShadowStory {
	protected readonly Math = Math;

	wind = input(false);
	options = input({} as NgtsSpotLightOptions);

	textures = injectTexture(
		() => ({
			diffuse: './textures/grassy_cobble/grassy_cobblestone_diff_2k.jpg',
			normal: './textures/grassy_cobble/grassy_cobblestone_nor_gl_2k.jpg',
			roughness: './textures/grassy_cobble/grassy_cobblestone_rough_2k.jpg',
			ao: './textures/grassy_cobble/grassy_cobblestone_ao_2k.jpg',
		}),
		{
			onLoad: (textures) => {
				textures.forEach((texture) => {
					texture.wrapS = texture.wrapT = RepeatWrapping;
					texture.repeat.set(2, 2);
				});
			},
		},
	);

	leafTexture = injectTexture(() => './textures/other/leaves.jpg');
	shader = computed(() => {
		if (!this.wind()) return undefined;
		return /* language=glsl glsl */ `
      varying vec2 vUv;
      uniform sampler2D uShadowMap;
      uniform float uTime;
      void main() {
        // material.repeat.set(2.5) - Since repeat is a shader feature not texture
        // we need to implement it manually
        vec2 uv = mod(vUv, 0.4) * 2.5;
        // Fake wind distortion
        uv.x += sin(uv.y * 10.0 + uTime * 0.5) * 0.02;
        uv.y += sin(uv.x * 10.0 + uTime * 0.5) * 0.02;
        vec3 color = texture2D(uShadowMap, uv).xyz;
        gl_FragColor = vec4(color, 1.);
      }
    `;
	});
}

@Component({
	standalone: true,
	template: `
		<ngts-spot-light [options]="spotLightOneOptions()" />
		<ngts-spot-light [options]="spotLightTwoOptions()" />

		<ngt-mesh [position]="[0, 0.5, 0]" [castShadow]="true">
			<ngt-box-geometry />
			<ngt-mesh-phong-material />
		</ngt-mesh>

		<ngt-mesh [receiveShadow]="true" [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-plane-geometry *args="[100, 100]" />
			<ngt-mesh-phong-material />
		</ngt-mesh>
	`,
	imports: [NgtsSpotLight, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultSpotLightStory {
	protected readonly Math = Math;

	options = input({} as NgtsSpotLightOptions);

	depthBuffer = injectDepthBuffer();

	spotLightOneOptions = computed(() => ({
		depthBuffer: this.depthBuffer(),
		position: [3, 2, 0],
		color: '#ff005b',
		...this.options(),
	}));
	spotLightTwoOptions = computed(() => ({
		depthBuffer: this.depthBuffer(),
		position: [-3, 2, 0],
		color: '#0EEC82',
		...this.options(),
	}));
}

export default {
	title: 'Staging/SpotLight',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultSpotLightStory, {
	canvasOptions: { lights: false },
	argsOptions: {
		options: {
			penumbra: 0.5,
			intensity: 0.5 * Math.PI,
			decay: 0,
			angle: 0.5,
			castShadow: true,
		},
	},
});

export const Shadows = makeStoryObject(SpotLightShadowStory, {
	canvasOptions: { controls: false, lights: false },
	argsOptions: {
		wind: true,
		options: {
			distance: 20,
			intensity: 5 * Math.PI,
			decay: 0,
			angle: MathUtils.degToRad(45),
			color: '#fadcb9',
			position: [5, 7, -2],
			volumetric: false,
			debug: false,
		},
	},
});
