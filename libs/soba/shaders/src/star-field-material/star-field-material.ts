import { shaderMaterial } from '../shader-material/shader-material';

export const StarFieldMaterial = shaderMaterial(
    { time: 0.0, fade: 0.0 },
    // language=GLSL
    `
uniform float time;
attribute float size;
varying vec3 vColor;
void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
  gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
  gl_Position = projectionMatrix * mvPosition;
}
  `,
    // language=GLSL
    `
uniform sampler2D pointTexture;
uniform float fade;
varying vec3 vColor;
void main() {
  float opacity = 1.0;
  if (fade == 1.0) {
    float d = distance(gl_PointCoord, vec2(0.5, 0.5));
    opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
  }
  gl_FragColor = vec4(vColor, opacity);

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}
  `
);
