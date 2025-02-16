import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { injectGLTF, injectTexture } from 'angular-three-soba/loaders';
import { injectAnimations, NgtsAnimationClips } from 'angular-three-soba/misc';
import {
	BufferGeometry,
	DoubleSide,
	Group,
	Mesh,
	MeshStandardMaterial,
	ShaderMaterial,
	SkinnedMesh,
	SRGBColorSpace,
} from 'three';
import { GLTF } from 'three-stdlib';

type SkydiverGLTF = GLTF & {
	nodes: {
		skydiver_2: SkinnedMesh<BufferGeometry, ShaderMaterial>;
		mixamorigHips: Mesh;
	};
	materials: {};
	animations: NgtsAnimationClips<'animation_0'>;
};

@Component({
	selector: 'app-skydiver',
	template: `
		<ngt-group [dispose]="null">
			@if (gltf(); as gltf) {
				<ngt-group #group>
					<ngt-primitive #bone *args="[gltf.nodes.mixamorigHips]" />
					<ngt-skinned-mesh
						[geometry]="gltf.nodes.skydiver_2.geometry"
						[skeleton]="gltf.nodes.skydiver_2.skeleton"
					>
						@let metallic = textures()?.metallic;
						@let normal = textures()?.normal;
						@let roughness = textures()?.roughness;
						@let baseColor = textures()?.baseColor;

						<ngt-mesh-standard-material
							[toneMapped]="false"
							[envMapIntensity]="0.8"
							[metalnessMap]="metallic"
							[normalMap]="normal"
							[roughnessMap]="roughness"
							[map]="baseColor"
							[normalScale]="[-0.2, 0.2]"
							[side]="DoubleSide"
							[parameters]="{ onBeforeCompile }"
						/>
					</ngt-skinned-mesh>
				</ngt-group>
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Skydiver {
	protected DoubleSide = DoubleSide;

	protected gltf = injectGLTF<SkydiverGLTF>(() => './skydiver.glb');
	protected textures = injectTexture(
		() => ({
			baseColor: './texture/skydiver_BaseColor.webp',
			roughness: './texture/skydiver_Roughness.webp',
			metallic: './texture/skydiver_Metallic.webp',
			normal: './texture/skydiver_Normal.webp',
			clothes: './texture/skydiver_Clothes.webp',
		}),
		{
			onLoad: (textures) => {
				textures.forEach((texture) => {
					texture.flipY = false;
					texture.colorSpace = SRGBColorSpace;
				});
			},
		},
	);

	private groupRef = viewChild<ElementRef<Group>>('group');
	private animations = injectAnimations(this.gltf, this.groupRef);

	protected onBeforeCompile: MeshStandardMaterial['onBeforeCompile'] = (shader) => {
		const gltf = this.gltf();
		if (!gltf) return;

		Object.assign(shader.uniforms, {
			...gltf.nodes['skydiver_2'].material.uniforms,
		});

		shader.vertexShader = /* language=glsl glsl */ `
        uniform float uTime;
        uniform sampler2D uClothes;
        ${shader.vertexShader}
        `;
		shader.vertexShader = shader.vertexShader.replace(
			`#include <begin_vertex>`,
			`
          vec3 clothesTexture = vec3(texture2D(uClothes, vMapUv));
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
			const gltf = this.gltf();
			if (!gltf) return;

			const textures = this.textures();
			if (!textures) return;

			gltf.nodes['skydiver_2'].material.uniforms = {
				uTime: { value: 0 },
				uClothes: { value: textures.clothes },
			};
		});

		effect((onCleanup) => {
			if (!this.animations.isReady) return;
			const { actions } = this.animations;
			actions['animation_0'].reset().play();
			onCleanup(() => actions['animation_0'].stop());
		});

		injectBeforeRender(({ clock }) => {
			const skydiver = this.gltf()?.nodes['skydiver_2'];
			if (skydiver?.material.uniforms?.['uTime']) {
				skydiver.material.uniforms['uTime'].value = clock.elapsedTime;
			}
		});
	}
}
