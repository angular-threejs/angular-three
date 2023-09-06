import { computed, effect, runInInjectionContext, type Injector } from '@angular/core';
import { assertInjector, type NgtShaderMaterial } from 'angular-three';
import * as THREE from 'three';
import { shaderMaterial } from '../shader-material/shader-material';

export type WireframeMaterialState = {
	fillOpacity?: number;
	fillMix?: number;
	strokeOpacity?: number;
	thickness?: number;
	colorBackfaces?: boolean;
	dashInvert?: boolean;
	dash?: boolean;
	dashRepeats?: number;
	dashLength?: number;
	squeeze?: boolean;
	squeezeMin?: number;
	squeezeMax?: number;
	stroke?: THREE.ColorRepresentation;
	backfaceStroke?: THREE.ColorRepresentation;
	fill?: THREE.ColorRepresentation;
};

export const WireframeMaterialShaders = {
	uniforms: {
		strokeOpacity: 1,
		fillOpacity: 0.25,
		fillMix: 0,
		thickness: 0.05,
		colorBackfaces: false,
		dashInvert: true,
		dash: false,
		dashRepeats: 4,
		dashLength: 0.5,
		squeeze: false,
		squeezeMin: 0.2,
		squeezeMax: 1,
		stroke: new THREE.Color('#ff0000'),
		backfaceStroke: new THREE.Color('#0000ff'),
		fill: new THREE.Color('#00ff00'),
	},
	vertex: /* glsl */ `
	  attribute vec3 barycentric;

		varying vec3 v_edges_Barycentric;
		varying vec3 v_edges_Position;

		void initWireframe() {
			v_edges_Barycentric = barycentric;
			v_edges_Position = position.xyz;
		}
	  `,
	fragment: /* glsl */ `
		#ifndef PI
	  	#define PI 3.1415926535897932384626433832795
		#endif

	  varying vec3 v_edges_Barycentric;
	  varying vec3 v_edges_Position;

	  uniform float strokeOpacity;
	  uniform float fillOpacity;
	  uniform float fillMix;
	  uniform float thickness;
	  uniform bool colorBackfaces;

	  // Dash
	  uniform bool dashInvert;
	  uniform bool dash;
	  uniform bool dashOnly;
	  uniform float dashRepeats;
	  uniform float dashLength;

	  // Squeeze
	  uniform bool squeeze;
	  uniform float squeezeMin;
	  uniform float squeezeMax;

	  // Colors
	  uniform vec3 stroke;
	  uniform vec3 backfaceStroke;
	  uniform vec3 fill;

	  // This is like
	  float wireframe_aastep(float threshold, float dist) {
		  float afwidth = fwidth(dist) * 0.5;
		  return smoothstep(threshold - afwidth, threshold + afwidth, dist);
	  }

	  float wireframe_map(float value, float min1, float max1, float min2, float max2) {
		  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
	  }

	  float getWireframe() {
			vec3 barycentric = v_edges_Barycentric;

			// Distance from center of each triangle to its edges.
			float d = min(min(barycentric.x, barycentric.y), barycentric.z);

			// for dashed rendering, we can use this to get the 0 .. 1 value of the line length
			float positionAlong = max(barycentric.x, barycentric.y);
			if (barycentric.y < barycentric.x && barycentric.y < barycentric.z) {
				positionAlong = 1.0 - positionAlong;
			}

			// the thickness of the stroke
			float computedThickness = wireframe_map(thickness, 0.0, 1.0, 0.0, 0.34);

			// if we want to shrink the thickness toward the center of the line segment
			if (squeeze) {
				computedThickness *= mix(squeezeMin, squeezeMax, (1.0 - sin(positionAlong * PI)));
			}

			// Create dash pattern
			if (dash) {
				// here we offset the stroke position depending on whether it
				// should overlap or not
				float offset = 1.0 / dashRepeats * dashLength / 2.0;
				if (!dashInvert) {
					offset += 1.0 / dashRepeats / 2.0;
				}

				// if we should animate the dash or not
				// if (dashAnimate) {
				// 	offset += time * 0.22;
				// }

				// create the repeating dash pattern
				float pattern = fract((positionAlong + offset) * dashRepeats);
				computedThickness *= 1.0 - wireframe_aastep(dashLength, pattern);
			}

			// compute the anti-aliased stroke edge
			float edge = 1.0 - wireframe_aastep(computedThickness, d);

			return edge;
	  }
	  `,
};

export const WireframeMaterial = shaderMaterial(
	WireframeMaterialShaders.uniforms,
	WireframeMaterialShaders.vertex +
		/* glsl */ `
  	void main() {
		initWireframe();
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
  `,
	WireframeMaterialShaders.fragment +
		/* glsl */ `
  void main () {
		// Compute color

		float edge = getWireframe();
		vec4 colorStroke = vec4(stroke, edge);

		#ifdef FLIP_SIDED
			colorStroke.rgb = backfaceStroke;
		#endif

		vec4 colorFill = vec4(fill, fillOpacity);
		vec4 outColor = mix(colorFill, colorStroke, edge * strokeOpacity);

		gl_FragColor = outColor;
	}
  `,
);

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-shader-material
		 */
		'ngt-wireframe-material': WireframeMaterialState & NgtShaderMaterial;
	}
}

export function setWireframeOverride(
	material: THREE.Material,
	uniforms: {
		[key: string]: THREE.IUniform<any>;
	},
) {
	material.onBeforeCompile = (shader) => {
		shader.uniforms = {
			...shader.uniforms,
			...uniforms,
		};

		shader.vertexShader = shader.vertexShader.replace(
			'void main() {',
			`
		  ${WireframeMaterialShaders.vertex}
		  void main() {
			initWireframe();
		`,
		);

		shader.fragmentShader = shader.fragmentShader.replace(
			'void main() {',
			`
		  ${WireframeMaterialShaders.fragment}
		  void main() {
		`,
		);

		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <color_fragment>',
			/* glsl */ `
		  #include <color_fragment>
			  float edge = getWireframe();
		  vec4 colorStroke = vec4(stroke, edge);
		  #ifdef FLIP_SIDED
			  colorStroke.rgb = backfaceStroke;
		  #endif
		  vec4 colorFill = vec4(mix(diffuseColor.rgb, fill, fillMix), mix(diffuseColor.a, fillOpacity, fillMix));
		  vec4 outColor = mix(colorFill, colorStroke, edge * strokeOpacity);

		  diffuseColor.rgb = outColor.rgb;
		  diffuseColor.a *= outColor.a;
		`,
		);
	};

	material.side = THREE.DoubleSide;
	material.transparent = true;
}

export function injectNgtsWireframeUniforms(
	uniformsFactory: () => Record<string, THREE.IUniform<any>>,
	stateFactory: () => Partial<WireframeMaterialState>,
	{ injector }: { injector?: Injector } = {},
) {
	injector = assertInjector(injectNgtsWireframeUniforms, injector);
	return runInInjectionContext(injector, () => {
		const uniforms = uniformsFactory();
		const state = computed(() => stateFactory());
		const fillOpacity = computed(() => state().fillOpacity);
		const fillMix = computed(() => state().fillMix);
		const strokeOpacity = computed(() => state().strokeOpacity);
		const thickness = computed(() => state().thickness);
		const colorBackfaces = computed(() => state().colorBackfaces);
		const dash = computed(() => state().dash);
		const dashInvert = computed(() => state().dashInvert);
		const dashRepeats = computed(() => state().dashRepeats);
		const dashLength = computed(() => state().dashLength);
		const squeeze = computed(() => state().squeeze);
		const squeezeMin = computed(() => state().squeezeMin);
		const squeezeMax = computed(() => state().squeezeMax);
		const stroke = computed(() => state().stroke);
		const fill = computed(() => state().fill);
		const backfaceStroke = computed(() => state().backfaceStroke);

		effect(() => {
			uniforms['fillOpacity'].value = fillOpacity() ?? uniforms['fillOpacity'].value;
		});

		effect(() => {
			uniforms['fillMix'].value = fillMix() ?? uniforms['fillMix'].value;
		});

		effect(() => {
			uniforms['strokeOpacity'].value = strokeOpacity() ?? uniforms['strokeOpacity'].value;
		});

		effect(() => {
			uniforms['thickness'].value = thickness() ?? uniforms['thickness'].value;
		});

		effect(() => {
			uniforms['colorBackfaces'].value = colorBackfaces() ?? uniforms['colorBackfaces'].value;
		});

		effect(() => {
			uniforms['dash'].value = dash() ?? uniforms['dash'].value;
		});

		effect(() => {
			uniforms['dashInvert'].value = dashInvert() ?? uniforms['dashInvert'].value;
		});

		effect(() => {
			uniforms['dashRepeats'].value = dashRepeats() ?? uniforms['dashRepeats'].value;
		});

		effect(() => {
			uniforms['dashLength'].value = dashLength() ?? uniforms['dashLength'].value;
		});

		effect(() => {
			uniforms['squeeze'].value = squeeze() ?? uniforms['squeeze'].value;
		});

		effect(() => {
			uniforms['squeezeMin'].value = squeezeMin() ?? uniforms['squeezeMin'].value;
		});

		effect(() => {
			uniforms['squeezeMax'].value = squeezeMax() ?? uniforms['squeezeMax'].value;
		});

		effect(() => {
			uniforms['stroke'].value = stroke() ? new THREE.Color(stroke()) : uniforms['stroke'].value;
		});

		effect(() => {
			uniforms['fill'].value = fill() ? new THREE.Color(fill()) : uniforms['fill'].value;
		});

		effect(() => {
			uniforms['backfaceStroke'].value = backfaceStroke()
				? new THREE.Color(backfaceStroke())
				: uniforms['backfaceStroke'].value;
		});
	});
}
