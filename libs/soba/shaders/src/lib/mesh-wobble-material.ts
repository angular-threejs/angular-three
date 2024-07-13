import { NgtMeshStandardMaterial } from 'angular-three';
import {
	IUniform,
	MeshStandardMaterial,
	MeshStandardMaterialParameters,
	WebGLProgramParametersWithUniforms,
} from 'three';

export interface MeshWobbleMaterialOptions extends Partial<NgtMeshStandardMaterial> {
	time?: number;
	factor?: number;
}

export class MeshWobbleMaterial extends MeshStandardMaterial {
	_time: IUniform<number>;
	_factor: IUniform<number>;

	constructor(parameters: MeshStandardMaterialParameters = {}) {
		super(parameters);
		this.setValues(parameters);
		this._time = { value: 0 };
		this._factor = { value: 1 };
	}

	override onBeforeCompile(shader: WebGLProgramParametersWithUniforms) {
		shader.uniforms['time'] = this._time;
		shader.uniforms['factor'] = this._factor;

		shader.vertexShader = `
      uniform float time;
      uniform float factor;
      ${shader.vertexShader}
    `;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			`float theta = sin( time + position.y ) / 2.0 * factor;
        float c = cos( theta );
        float s = sin( theta );
        mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
        vec3 transformed = vec3( position ) * m;
        vNormal = vNormal * m;`,
		);
	}

	get time() {
		return this._time.value;
	}

	set time(v) {
		this._time.value = v;
	}

	get factor() {
		return this._factor.value;
	}

	set factor(v) {
		this._factor.value = v;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-standard-material
		 */
		'ngt-mesh-wobble-material': MeshWobbleMaterialOptions & NgtMeshStandardMaterial;
	}
}
