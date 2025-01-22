import { NgtThreeElement } from 'angular-three';
import { getVersion } from 'angular-three-soba/misc';
import * as THREE from 'three';

const opaque_fragment = getVersion() >= 154 ? 'opaque_fragment' : 'output_fragment';

export class PointMaterial extends THREE.PointsMaterial {
	constructor(props: THREE.PointsMaterialParameters) {
		super(props);
		this.onBeforeCompile = (shader, renderer) => {
			const { isWebGL2 } = renderer.capabilities;
			shader.fragmentShader = shader.fragmentShader.replace(
				`#include <${opaque_fragment}>`,
				`
        ${
					!isWebGL2
						? `#extension GL_OES_standard_derivatives : enable\n#include <${opaque_fragment}>`
						: `#include <${opaque_fragment}>`
				}
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      float delta = fwidth(r);
      float mask = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      gl_FragColor = vec4(gl_FragColor.rgb, mask * gl_FragColor.a );
      #include <tonemapping_fragment>
      #include <${getVersion() >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
      `,
			);
		};
	}
}

export type NgtPointMaterial = NgtThreeElement<typeof PointMaterial>;

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-points-material
		 */
		'ngt-point-material': NgtPointMaterial;
	}
}
