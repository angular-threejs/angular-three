import * as THREE from 'three';
import { shaderMaterial } from '../shader-material/shader-material';

export const GridMaterial = shaderMaterial(
    {
        cellSize: 0.5,
        sectionSize: 1,
        fadeDistance: 100,
        fadeStrength: 1,
        cellThickness: 0.5,
        sectionThickness: 1,
        cellColor: new THREE.Color(),
        sectionColor: new THREE.Color(),
        infiniteGrid: false,
        followCamera: false,
    },
    /* glsl */ `
    varying vec3 worldPosition;
    uniform float fadeDistance;
    uniform bool infiniteGrid;
    uniform bool followCamera;

    void main() {
      worldPosition = position.xzy;
      if (infiniteGrid) worldPosition *= 1.0 + fadeDistance;
      if (followCamera) worldPosition.xz +=cameraPosition.xz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
    }
  `,
    /* glsl */ `
    varying vec3 worldPosition;
    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = worldPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1. - thickness;
      return 1.0 - min(line, 1.);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      float d = 1.0 - min(distance(cameraPosition.xz, worldPosition.xz) / fadeDistance, 1.);
      vec3 color = mix(cellColor, sectionColor, min(1.,sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d,fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `
);
