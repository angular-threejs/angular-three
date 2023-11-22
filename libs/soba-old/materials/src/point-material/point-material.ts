import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs, injectNgtRef, type NgtPointsMaterial } from 'angular-three-old';
import * as THREE from 'three';

const opaque_fragment = parseInt(THREE.REVISION.replace(/\D+/g, '')) >= 154 ? 'opaque_fragment' : 'output_fragment';

export class PointMaterial extends THREE.PointsMaterial {
	constructor(parameters: THREE.PointsMaterialParameters) {
		super(parameters);
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
      #include <${parseInt(THREE.REVISION.replace(/\D+/g, '')) >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
      `,
			);
		};
	}
}

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-points-material
		 */
		'ngt-point-material': NgtPointsMaterial;
		/**
		 * @extends ngt-points-material
		 */
		'ngts-point-material': NgtPointsMaterial;
	}
}

@Component({
	selector: 'ngts-point-material',
	standalone: true,
	template: `
		<ngt-primitive ngtCompound [ref]="pointMaterialRef" *args="[material]" attach="material" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPointMaterial {
	@Input() pointMaterialRef = injectNgtRef<PointMaterial>();

	material = new PointMaterial({});
}
