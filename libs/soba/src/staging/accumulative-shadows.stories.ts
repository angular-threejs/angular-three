import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, merge } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import {
	NgtsAccumulativeShadows,
	NgtsAccumulativeShadowsOptions,
	NgtsEnvironment,
	NgtsRandomizedLights,
} from 'angular-three-soba/staging';
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, UVMapping } from 'three';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture';
import { color, makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'accumulative-shadows-suzi',
	standalone: true,
	template: `
		<ngt-primitive *args="[scene()]" [parameters]="{ rotation: [-0.63, 0, 0], scale: 2, position: [0, -1.175, 0] }" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Suzi {
	gltf = injectGLTF(() => './suzanne-high-poly.gltf');

	scene = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;
		const { scene, materials } = gltf;
		scene.traverse((obj) => (obj as any).isMesh && (obj.receiveShadow = obj.castShadow = true));

		const material = materials['default'] as MeshStandardMaterial;

		material.color.set('orange');
		material.roughness = 0;
		material.normalMap = new CanvasTexture(new FlakesTexture(), UVMapping, RepeatWrapping, RepeatWrapping);
		material.normalMap.flipY = false;
		material.normalMap.repeat.set(40, 40);
		material.normalScale.set(0.05, 0.05);

		return scene;
	});
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['goldenrod']" attach="background" />
		<accumulative-shadows-suzi />

		<ngts-accumulative-shadows [options]="accumulativeShadowsOptions()">
			<ngts-randomized-lights [options]="{ amount: 8, radius: 4, ambient: 0.5, bias: 0.001, position: [5, 5, -10] }" />
		</ngts-accumulative-shadows>

		<ngts-orbit-controls [options]="{ autoRotate: true }" />
		<ngts-environment [options]="{ preset: 'city' }" />
	`,
	imports: [Suzi, NgtsAccumulativeShadows, NgtsRandomizedLights, NgtArgs, NgtsOrbitControls, NgtsEnvironment],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultAccumulativeShadowsStory {
	options = input({} as NgtsAccumulativeShadowsOptions);
	accumulativeShadowsOptions = merge(this.options, { position: [0, -0.5, 0] });
}

export default {
	title: 'Staging/Accumulative Shadows',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultAccumulativeShadowsStory, {
	argsOptions: {
		options: {
			temporal: true,
			frames: 100,
			color: color('goldenrod'),
			alphaTest: 0.65,
			opacity: 2,
			scale: 14,
		},
	},
});
