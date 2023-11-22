import { revision } from 'angular-three-soba-old/utils';
import * as THREE from 'three';
import { shaderMaterial } from '../shader-material/shader-material';

export const CausticsProjectionMaterial = shaderMaterial(
	{
		causticsTexture: null,
		causticsTextureB: null,
		color: new THREE.Color(),
		lightProjMatrix: new THREE.Matrix4(),
		lightViewMatrix: new THREE.Matrix4(),
	},
	`varying vec3 vWorldPosition;
   void main() {
     gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
     vec4 worldPosition = modelMatrix * vec4(position, 1.);
     vWorldPosition = worldPosition.xyz;
   }`,
	`varying vec3 vWorldPosition;
  uniform vec3 color;
  uniform sampler2D causticsTexture;
  uniform sampler2D causticsTextureB;
  uniform mat4 lightProjMatrix;
  uniform mat4 lightViewMatrix;
   void main() {
    // Apply caustics
    vec4 lightSpacePos = lightProjMatrix * lightViewMatrix * vec4(vWorldPosition, 1.0);
    lightSpacePos.xyz /= lightSpacePos.w;
    lightSpacePos.xyz = lightSpacePos.xyz * 0.5 + 0.5;
    vec3 front = texture2D(causticsTexture, lightSpacePos.xy).rgb;
    vec3 back = texture2D(causticsTextureB, lightSpacePos.xy).rgb;
    gl_FragColor = vec4((front + back) * color, 1.0);
    #include <tonemapping_fragment>
    #include <${revision >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
   }`,
);
