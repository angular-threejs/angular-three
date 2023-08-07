import type { NgtShaderMaterial } from 'angular-three';
import * as THREE from 'three';
import { shaderMaterial } from '../shader-material/shader-material';

export const SoftShadowMaterial = shaderMaterial(
	{
		color: new THREE.Color(),
		blend: 2.0,
		alphaTest: 0.75,
		opacity: 0,
		map: null,
	},
	`varying vec2 vUv;
   void main() {
     gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
     vUv = uv;
   }`,
	`varying vec2 vUv;
   uniform sampler2D map;
   uniform vec3 color;
   uniform float opacity;
   uniform float alphaTest;
   uniform float blend;
   void main() {
     vec4 sampledDiffuseColor = texture2D(map, vUv);
     gl_FragColor = vec4(color * sampledDiffuseColor.r * blend, max(0.0, (1.0 - (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / alphaTest)) * opacity);
     #include <tonemapping_fragment>
     #include <${parseInt(THREE.REVISION.replace(/\D+/g, '')) >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
   }`,
);

export type NgtSoftShadowMaterialState = {
	map: THREE.Texture;
	color?: THREE.ColorRepresentation;
	alphaTest?: number;
	blend?: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 *  @extends ngt-shader-material
		 */
		'ngt-soft-shadow-material': NgtSoftShadowMaterialState & NgtShaderMaterial;
	}
}
