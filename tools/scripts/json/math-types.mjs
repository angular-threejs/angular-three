export const MATH_TYPE_MAP = {
	Vector2: {
		type: 'NgtVector2',
		accepts: ['THREE.Vector2', '[number, number]', 'number'],
	},
	Vector3: {
		type: 'NgtVector3',
		accepts: ['THREE.Vector3', '[number, number, number]', 'number'],
	},
	Color: {
		type: 'NgtColor',
		accepts: ['THREE.Color', 'string', 'number', '[number, number, number]'],
	},
	Euler: {
		type: 'NgtEuler',
		accepts: ['THREE.Euler', '[number, number, number]', '[number, number, number, string]'],
	},
	Quaternion: {
		type: 'NgtQuaternion',
		accepts: ['THREE.Quaternion', '[number, number, number, number]'],
	},
	Matrix3: {
		type: 'NgtMatrix3',
		accepts: ['THREE.Matrix3', '[number, number, number, number, number, number, number, number, number]'],
	},
	Matrix4: {
		type: 'NgtMatrix4',
		accepts: [
			'THREE.Matrix4',
			'[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]',
		],
	},
	Layers: { type: 'NgtLayers', accepts: ['THREE.Layers', 'number'] },
};
