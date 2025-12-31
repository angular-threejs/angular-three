import { NgtThreeElement } from 'angular-three';
import { getVersion } from 'angular-three-soba/misc';
import { shaderMaterial } from 'angular-three-soba/vanilla-exports';
import * as THREE from 'three';

/**
 * Configuration options for the GridMaterial shader material.
 * Controls the appearance, size, and behavior of the infinite grid.
 */
export interface GridMaterialOptions {
	/**
	 * Size of individual grid cells.
	 * @default 0.5
	 */
	cellSize: number;
	/**
	 * Thickness of cell grid lines.
	 * @default 0.5
	 */
	cellThickness: number;
	/**
	 * Color of the cell grid lines.
	 * @default 'black'
	 */
	cellColor: THREE.ColorRepresentation;
	/**
	 * Size of section divisions (larger grid squares).
	 * @default 1
	 */
	sectionSize: number;
	/**
	 * Thickness of section grid lines.
	 * @default 1
	 */
	sectionThickness: number;
	/**
	 * Color of the section grid lines.
	 * @default '#2080ff'
	 */
	sectionColor: THREE.ColorRepresentation;
	/**
	 * Whether the grid should follow the camera position.
	 * @default false
	 */
	followCamera: boolean;
	/**
	 * Whether to display the grid infinitely extending to the horizon.
	 * @default false
	 */
	infiniteGrid: boolean;
	/**
	 * Distance at which the grid starts to fade out.
	 * @default 100
	 */
	fadeDistance: number;
	/**
	 * Strength of the fade effect (higher values = sharper fade).
	 * @default 1
	 */
	fadeStrength: number;
	/**
	 * Controls the fade origin point: 1 = from camera, 0 = from origin, values in between interpolate.
	 * @default 1 (camera)
	 */
	fadeFrom: number;
	/**
	 * Which side of the material to render.
	 * @default THREE.BackSide
	 */
	side: THREE.Side;
}

/**
 * A shader material that renders an infinite grid with customizable cells and sections.
 * Supports fading, camera following, and dual-layer grid lines (cells and sections).
 *
 * @example
 * ```typescript
 * extend({ GridMaterial });
 * ```
 *
 * @example
 * ```html
 * <ngt-grid-material
 *   [cellSize]="0.5"
 *   [sectionSize]="1"
 *   [fadeDistance]="100"
 *   [infiniteGrid]="true"
 * />
 * ```
 */
export const GridMaterial = shaderMaterial(
	{
		cellSize: 0.5,
		sectionSize: 1,
		fadeDistance: 100,
		fadeStrength: 1,
		fadeFrom: 1,
		cellThickness: 0.5,
		sectionThickness: 1,
		cellColor: new THREE.Color(),
		sectionColor: new THREE.Color(),
		infiniteGrid: false,
		followCamera: false,
		worldCamProjPosition: new THREE.Vector3(),
		worldPlanePosition: new THREE.Vector3(),
	},
	/* language=glsl glsl */ `
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform vec3 worldPlanePosition;
    uniform float fadeDistance;
    uniform bool infiniteGrid;
    uniform bool followCamera;

    void main() {
      localPosition = position.xzy;
      if (infiniteGrid) localPosition *= 1.0 + fadeDistance;

      worldPosition = modelMatrix * vec4(localPosition, 1.0);
      if (followCamera) {
        worldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
        localPosition = (inverse(modelMatrix) * worldPosition).xyz;
      }

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
	/* language=glsl glsl */ `
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float fadeFrom;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = localPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1.0 - thickness;
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      vec3 from = worldCamProjPosition*vec3(fadeFrom);
      float dist = distance(from, worldPosition.xyz);
      float d = 1.0 - min(dist / fadeDistance, 1.0);
      vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <${getVersion() >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
    }
  `,
);

/**
 * Type definition for the GridMaterial element in Angular Three templates.
 * Extends NgtThreeElement to provide type-safe template usage.
 */
export type NgtGridMaterial = NgtThreeElement<typeof GridMaterial>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-shader-material
		 * @options GridMaterialOptions
		 */
		'ngt-grid-material': NgtGridMaterial;
	}
}
