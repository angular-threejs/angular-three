import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsCustomShaderMaterial } from 'angular-three-soba/materials';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { patchShaders } from 'gl-noise';
import { PointsMaterial } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

const shader = {
	vertex: /* glsl */ `
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
	fragment: /* glsl */ `
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
				<ngts-custom-shader-material [baseMaterial]="PointsMaterial" [options]="options" />
			</ngt-points>
		</ngt-group>
	`,
	imports: [NgtsEnvironment, NgtsCustomShaderMaterial, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultCustomShaderMaterialStory {
	PointsMaterial = PointsMaterial;

	options = {
		fragmentShader: patchShaders(shader.fragment),
		vertexShader: patchShaders(shader.vertex),
		size: 0.02,
		uniforms: { uTime: { value: 0 } },
		transparent: true,
	};

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

export const Default = makeStoryFunction(DefaultCustomShaderMaterialStory, {
	camera: { position: [0, 0, 2.5] },
});
