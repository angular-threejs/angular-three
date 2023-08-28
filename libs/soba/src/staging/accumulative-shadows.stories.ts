import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, type Signal } from '@angular/core';
import { applyProps, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsGLTFLoader, type NgtsGLTF } from 'angular-three-soba/loaders';
import { NgtsAccumulativeShadows, NgtsEnvironment, NgtsRandomizedLights } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

injectNgtsGLTFLoader.preload(
	() => 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/suzanne-high-poly/model.gltf',
);

type SuziGLTF = NgtsGLTF<{ materials: { default: THREE.MeshStandardMaterial } }>;

@Component({
	selector: 'accumulative-shadows-suzi',
	standalone: true,
	template: `
		<ngt-primitive ngtCompound *args="[model()]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Suzi {
	private suziGLTF = injectNgtsGLTFLoader(
		() => 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/suzanne-high-poly/model.gltf',
	) as Signal<SuziGLTF>;
	model = computed(() => {
		const suzi = this.suziGLTF();
		if (!suzi) return null;
		return suzi.scene;
	});

	constructor() {
		effect(() => {
			const suzi = this.suziGLTF();
			if (!suzi) return;
			const { scene, materials } = suzi;
			scene.traverse((obj: any) => obj.isMesh && (obj.receiveShadow = obj.castShadow = true));
			applyProps(materials.default, {
				color: 'orange',
				roughness: 0,
				normalMap: new THREE.CanvasTexture(
					new FlakesTexture(),
					THREE.UVMapping,
					THREE.RepeatWrapping,
					THREE.RepeatWrapping,
				),
				normalScale: [0.05, 0.05],
			});
			applyProps(materials.default.normalMap, {
				flipY: false,
				repeat: [40, 40],
			});
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['goldenrod']" attach="background" />

		<accumulative-shadows-suzi [rotation]="[-0.63, 0, 0]" [scale]="2" [position]="[0, -1.175, 0]" />
		<ngts-accumulative-shadows
			color="goldenrod"
			[temporal]="true"
			[frames]="100"
			[alphaTest]="0.65"
			[opacity]="2"
			[scale]="14"
			[position]="[0, -0.5, 0]"
		>
			<ngts-randomized-lights [amount]="8" [radius]="4" [ambient]="0.5" [bias]="0.001" [position]="[5, 5, -10]" />
		</ngts-accumulative-shadows>
		<ngts-orbit-controls [autoRotate]="true" />
		<ngts-environment preset="city" />
	`,
	imports: [NgtsAccumulativeShadows, NgtsRandomizedLights, NgtsOrbitControls, NgtsEnvironment, NgtArgs, Suzi],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultAccumulativeShadowsStory {}

export default {
	title: 'Staging/Accumulative Shadows',
	decorators: makeDecorators(),
};

export const Default = makeStoryFunction(DefaultAccumulativeShadowsStory, {
	compoundPrefixes: ['accumulative-shadows-suzi'],
	// NOTE: only works with this
	useLegacyLights: true,
});
