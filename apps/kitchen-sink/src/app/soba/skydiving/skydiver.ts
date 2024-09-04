import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	Signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { injectGLTF, injectTexture } from 'angular-three-soba/loaders';
import { injectAnimations } from 'angular-three-soba/misc';
import { Bone, BufferGeometry, DoubleSide, Mesh, MeshStandardMaterial, ShaderMaterial, SkinnedMesh } from 'three';
import { GLTF } from 'three-stdlib';

type SkydiverGLTF = GLTF & {
	nodes: {
		skydiver_2: SkinnedMesh<BufferGeometry, ShaderMaterial>;
		mixamorigHips: Mesh;
	};
	materials: {};
};

@Component({
	selector: 'app-skydiver',
	standalone: true,
	template: `
		<ngt-group [dispose]="null">
			@if (gltf(); as gltf) {
				<ngt-group>
					<ngt-primitive #bone *args="[gltf.nodes.mixamorigHips]" />
					<ngt-skinned-mesh [geometry]="gltf.nodes.skydiver_2.geometry" [skeleton]="gltf.nodes.skydiver_2.skeleton">
						@if (textures(); as textures) {
							<ngt-mesh-standard-material
								[parameters]="{
									uniforms: { uTime: { value: 0 }, uClothes: { value: textures.clothes } },
									onBeforeCompile,
									toneMapped: false,
									envMapIntensity: 0.8,
									metalnessMap: textures.metallic,
									normalMap: textures.normal,
									roughnessMap: textures.roughness,
									map: textures.baseColor,
									normalScale: [-0.2, 0.2],
									side: DoubleSide,
								}"
							/>
						}
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

	protected gltf = injectGLTF(() => './skydiver.glb') as Signal<SkydiverGLTF | null>;
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
				});
			},
		},
	);

	private boneRef = viewChild<ElementRef<Bone>>('bone');
	private animations = injectAnimations(this.gltf, this.boneRef);

	protected onBeforeCompile: MeshStandardMaterial['onBeforeCompile'] = (shader) => {
		const gltf = this.gltf();

		Object.assign(shader.uniforms, {
			...(gltf?.nodes['skydiver_2'].material?.uniforms || {}),
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
		effect((onCleanup) => {
			const ready = this.animations.ready();
			if (!ready) return;
			const { actions } = this.animations;
			actions['animation_0']?.reset().play();
			onCleanup(() => actions['animation_0']?.stop());
		});

		injectBeforeRender(({ clock }) => {
			const skydiver = this.gltf()?.nodes['skydiver_2'];
			if (skydiver?.material.uniforms?.['uTime']) {
				skydiver.material.uniforms['uTime'].value = clock.getElapsedTime();
			}
		});
	}
}
