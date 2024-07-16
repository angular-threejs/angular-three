import { NgtMaterial } from 'angular-three';
import { getVersion } from 'angular-three-soba/misc';
import { shaderMaterial } from 'angular-three-soba/vanilla-exports';
import { Color, ColorRepresentation, Side, Vector3 } from 'three';

export interface GridMaterialOptions {
	/** Cell size, default: 0.5 */
	cellSize: number;
	/** Cell thickness, default: 0.5 */
	cellThickness: number;
	/** Cell color, default: black */
	cellColor: ColorRepresentation;
	/** Section size, default: 1 */
	sectionSize: number;
	/** Section thickness, default: 1 */
	sectionThickness: number;
	/** Section color, default: #2080ff */
	sectionColor: ColorRepresentation;
	/** Follow camera, default: false */
	followCamera: boolean;
	/** Display the grid infinitely, default: false */
	infiniteGrid: boolean;
	/** Fade distance, default: 100 */
	fadeDistance: number;
	/** Fade strength, default: 1 */
	fadeStrength: number;
	/** Fade from camera (1) or origin (0), or somewhere in between, default: camera */
	fadeFrom: number;
	/** Material side, default: THREE.BackSide */
	side: Side;
}

export const GridMaterial = shaderMaterial(
	{
		cellSize: 0.5,
		sectionSize: 1,
		fadeDistance: 100,
		fadeStrength: 1,
		fadeFrom: 1,
		cellThickness: 0.5,
		sectionThickness: 1,
		cellColor: new Color(),
		sectionColor: new Color(),
		infiniteGrid: false,
		followCamera: false,
		worldCamProjPosition: new Vector3(),
		worldPlanePosition: new Vector3(),
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

export type NgtGridMaterial = NgtMaterial<InstanceType<typeof GridMaterial>, [GridMaterialOptions]>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-shader-material
		 * @options GridMaterialOptions
		 */
		'ngt-grid-material': NgtGridMaterial;
	}
}
