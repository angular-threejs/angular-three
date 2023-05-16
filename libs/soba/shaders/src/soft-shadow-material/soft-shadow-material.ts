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
    // language=glsl
    `
varying vec2 vUv;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  vUv = uv;
}
    `,
    // language=glsl
    `
varying vec2 vUv;
uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float alphaTest;
uniform float blend;
void main() {
  vec4 sampledDiffuseColor = texture2D(map, vUv);
  gl_FragColor = vec4(color * sampledDiffuseColor.r * blend, max(0.0, (1.0 - (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / alphaTest)) * opacity);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}
    `
);

export interface SoftShadowMaterialInputs {
    map: THREE.Texture;
    color?: THREE.ColorRepresentation;
    alphaTest?: number;
    blend?: number;
}
