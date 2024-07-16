import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsCustomShaderMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { patchShaders } from 'gl-noise';
import { PointsMaterial } from 'three';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

const shader = {
	vertex: /* language=glsl glsl */ `
    uniform float uTime;
    varying float vVisibility;
    varying vec3 vViewNormal;

    void main() {
      vec3 n = gln_curl(position + uTime * 0.05);


			vec3 _viewNormal = normalMatrix * normal;
      vViewNormal = _viewNormal;
			vec4 _mvPosition = modelViewMatrix * vec4(position, 1.);

    	float visibility = step(-0.1, dot(-normalize(_mvPosition.xyz), normalize(_viewNormal)));
      vVisibility = visibility;

      csm_Position = position + (normal * n * 0.5);
      csm_PointSize += ((1. - visibility) * 0.05);
    }
    `,
	fragment: /* language=glsl glsl */ `
    varying float vVisibility;
    varying vec3 vViewNormal;

    void main() {

      vec2 uv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
      vec2 cUV = 2. * uv - 1.;
      float a = .15 / length(cUV);
      float alpha = 1.;
      if(a < 0.15) alpha = 0.;

      csm_DiffuseColor = vec4(vViewNormal, (vVisibility + 0.01) * alpha);
    }
    `,
};

@Component({
	standalone: true,
	template: `
		<ngts-environment
			[options]="{ files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr' }"
		/>

		<!--    this also works-->
		<!--		<ngt-points-material #material attach="none" />-->

		<ngt-group>
			<ngt-points>
				<ngt-icosahedron-geometry *args="[1, 32]" />
				<ngts-custom-shader-material [baseMaterial]="PointsMaterial" [options]="options()" />
			</ngt-points>
		</ngt-group>
	`,
	imports: [NgtsEnvironment, NgtsCustomShaderMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultCustomShaderMaterialStory {
	PointsMaterial = PointsMaterial;

	size = input(0.02);
	transparent = input(true);

	options = computed(() => ({
		fragmentShader: patchShaders(shader.fragment),
		vertexShader: patchShaders(shader.vertex),
		size: this.size(),
		uniforms: { uTime: { value: 0 } },
		transparent: this.transparent(),
	}));

	materialRef = viewChild.required(NgtsCustomShaderMaterial);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const material = this.materialRef().material();
			material.uniforms['uTime'].value = clock.getElapsedTime();
		});
	}
}

export default {
	title: 'Materials/Custom Shader Material',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultCustomShaderMaterialStory, {
	canvasOptions: { camera: { position: [0, 0, 2.5] } },
	argsOptions: {
		size: number(0.02, { range: true, min: 0.01, max: 0.1, step: 0.01 }),
		transparent: true,
	},
});
