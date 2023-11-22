import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, effect, type Signal } from '@angular/core';
import { NgtArgs, injectBeforeRender } from 'angular-three-old';
import { injectNgtsGLTFLoader, injectNgtsTextureLoader, type NgtsGLTF } from 'angular-three-soba-old/loaders';
import { injectNgtsAnimations } from 'angular-three-soba-old/misc';
import * as THREE from 'three';

type SkydiverGLTF = NgtsGLTF<{
	nodes: {
		skydiver_2: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
		mixamorigHips: THREE.Mesh;
	};
}>;

@Component({
	selector: 'app-model',
	standalone: true,
	template: `
		<ngt-group [dispose]="null">
			<ngt-group *ngIf="skydiverGltf() as skydiverGltf" [ref]="animations.ref">
				<ngt-primitive *args="[skydiverGltf.nodes['mixamorigHips']]" />
				<ngt-skinned-mesh
					[geometry]="skydiverGltf.nodes['skydiver_2'].geometry"
					[skeleton]="skydiverGltf.nodes['skydiver_2'].skeleton"
				>
					<ngt-mesh-standard-material
						[side]="DoubleSide"
						[map]="textures()?.baseColor"
						[roughnessMap]="textures()?.roughness"
						[normalMap]="textures()?.normal"
						[metalnessMap]="textures()?.metallic"
						[normalScale]="[-0.2, 0.2]"
						[envMapIntensity]="0.8"
						[toneMapped]="false"
						[uniforms]="{ uTime: { value: 0 } }"
						(afterAttach)="$event.node.onBeforeCompile = onBeforeCompile"
					/>
				</ngt-skinned-mesh>
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Model {
	DoubleSide = THREE.DoubleSide;
	textures = injectNgtsTextureLoader(
		() => ({
			baseColor: 'assets/texture/skydiver_BaseColor.webp',
			roughness: 'assets/texture/skydiver_Roughness.webp',
			metallic: 'assets/texture/skydiver_Metallic.webp',
			normal: 'assets/texture/skydiver_Normal.webp',
			clothes: 'assets/texture/skydiver_Clothes.webp',
		}),
		{
			onLoad: (textures) => {
				if (Array.isArray(textures)) {
					const [baseColor, roughness, metallic, normal, clothes] = textures;
					baseColor.flipY = roughness.flipY = metallic.flipY = normal.flipY = clothes.flipY = false;
				}
			},
		},
	);

	skydiverGltf = injectNgtsGLTFLoader(() => 'assets/skydiver.glb') as Signal<SkydiverGLTF>;

	animations = injectNgtsAnimations(() => this.skydiverGltf()?.animations || [], { playFirstClip: false });

	onBeforeCompile: THREE.MeshStandardMaterial['onBeforeCompile'] = (shader) => {
		Object.assign(shader.uniforms, {
			...((this.skydiverGltf()?.nodes['skydiver_2']).material.uniforms || {}),
		});
		shader.vertexShader = `
        uniform float uTime;
        uniform sampler2D uClothes;
        ${shader.vertexShader}
        `;
		shader.vertexShader = shader.vertexShader.replace(
			`#include <begin_vertex>`,
			`
          vec3 clothesTexture = vec3(texture2D(uClothes, vUv));
          float circleTime = 2.0;
          float amplitude = 30.0;
          float circleTimeParam = mod(uTime, circleTime);
          vec3 transformed = vec3( position );
          transformed.y += min(clothesTexture.y * sin( circleTimeParam * amplitude * (PI  / circleTime)) * 0.025, 0.5);
        `,
		);
	};

	constructor() {
		effect(() => {
			const ready = this.animations.ready();
			if (!ready) return;
			const { actions } = this.animations;
			actions['animation_0'].reset().play();

			const [textures, gltf] = [this.textures(), this.skydiverGltf()];
			if (!textures || !gltf) return;
			gltf.nodes['skydiver_2'].material.uniforms = {
				uTime: { value: 0 },
				uClothes: { value: textures.clothes },
			};
		});

		injectBeforeRender(({ clock }) => {
			const skydiver = this.skydiverGltf()?.nodes['skydiver_2'];
			if (skydiver?.material.uniforms?.['uTime']) {
				skydiver.material.uniforms['uTime'].value = clock.getElapsedTime();
			}
		});
	}
}
