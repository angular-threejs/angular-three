import {
	Color,
	CubeTexture,
	MathUtils,
	Matrix3,
	Matrix4,
	Quaternion,
	ShaderMaterial,
	Texture,
	UniformsUtils,
	Vector2,
	Vector3,
	Vector4,
} from 'three';
import { MeshBVHUniformStruct } from 'three-mesh-bvh';

export function shaderMaterial(
	uniforms: {
		[name: string]:
			| CubeTexture
			| Texture
			| Int32Array
			| Float32Array
			| Matrix4
			| Matrix3
			| Quaternion
			| Vector4
			| Vector3
			| Vector2
			| Color
			| MeshBVHUniformStruct
			| number
			| boolean
			| Array<any>
			| null;
	},
	vertexShader: string,
	fragmentShader: string,
	onInit?: (material?: ShaderMaterial) => void,
) {
	const material = class extends ShaderMaterial {
		public key: string = '';
		constructor(parameters = {}) {
			const entries = Object.entries(uniforms);
			// Create unforms and shaders
			super({
				uniforms: entries.reduce((acc, [name, value]) => {
					const uniform = UniformsUtils.clone({ [name]: { value } });
					return { ...acc, ...uniform };
				}, {}),
				vertexShader,
				fragmentShader,
			});
			// Create getter/setters
			entries.forEach(([name]) =>
				Object.defineProperty(this, name, {
					get: () => this.uniforms[name].value,
					set: (v) => (this.uniforms[name].value = v),
				}),
			);

			// Assign parameters, this might include uniforms
			Object.assign(this, parameters);
			// Call onInit
			if (onInit) onInit(this);
		}
	} as unknown as typeof ShaderMaterial & { key: string };
	material.key = MathUtils.generateUUID();
	return material;
}
