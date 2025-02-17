import simulationFragmentShader from './simulation-fragment.glsl' with { loader: 'text' };
import simulationVertexShader from './simulation-vertex.glsl' with { loader: 'text' };

import shapes from './shapes.json';

import * as THREE from 'three';

function generateRandomPointInTriangle(v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) {
	const r1 = Math.random();
	const r2 = Math.random();
	const r3 = Math.random();
	const sum = r1 + r2 + r3;

	return new THREE.Vector3()
		.addScaledVector(v1, r1 / sum)
		.addScaledVector(v2, r2 / sum)
		.addScaledVector(v3, r3 / sum);
}

function createGeometryFromCurve(curveData: (typeof shapes)['curve']) {
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(curveData.data.attributes.position.array, 3));
	geometry.setAttribute('normal', new THREE.Float32BufferAttribute(curveData.data.attributes.normal.array, 3));
	geometry.setAttribute('uv', new THREE.Float32BufferAttribute(curveData.data.attributes.uv.array, 2));
	geometry.setIndex(new THREE.Uint16BufferAttribute(curveData.data.index.array, 1));
	return geometry;
}

function getRandomData(width: number, height: number) {
	const length = width * height * 4;
	const data = new Float32Array(length);
	const curves = [shapes.curve, shapes.curveTwo, shapes.curveThree, shapes.curveFour];

	const scale = 8;
	const baseRotation = new THREE.Euler(Math.PI / 2, 0, 0);
	const positions = Array(4).fill(new THREE.Vector3(0, 0, 0));

	for (let i = 0; i < length; i += 4) {
		const shapeIndex = Math.floor((i / length) * curves.length);
		const curveData = curves[shapeIndex];

		const matrix = new THREE.Matrix4()
			.makeRotationFromEuler(baseRotation)
			.setPosition(positions[shapeIndex])
			.scale(new THREE.Vector3(scale, scale, scale));

		const geometry = createGeometryFromCurve(curveData);
		const positionsArr = geometry.attributes['position'].array;
		const indices = curveData.data.index.array;

		const triangleIndex = Math.floor(Math.random() * (indices.length / 3)) * 3;

		const vertices = [0, 1, 2].map((offset) => {
			const idx = indices[triangleIndex + offset] * 3;
			return new THREE.Vector3(positionsArr[idx], positionsArr[idx + 1], positionsArr[idx + 2]);
		}) as [THREE.Vector3, THREE.Vector3, THREE.Vector3];

		const pos = generateRandomPointInTriangle(...vertices);
		pos.applyMatrix4(matrix);

		data[i] = pos.x;
		data[i + 1] = pos.y;
		data[i + 2] = pos.z;
		data[i + 3] = 1.0;
	}

	return data;
}

export class SimulationMaterial extends THREE.ShaderMaterial {
	constructor(size: number) {
		const positionsTexture = new THREE.DataTexture(
			getRandomData(size, size),
			size,
			size,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		positionsTexture.needsUpdate = true;

		super({
			uniforms: {
				positions: { value: positionsTexture },
				uFrequency: { value: 0.25 },
				uTime: { value: 0 },
			},
			vertexShader: simulationVertexShader,
			fragmentShader: simulationFragmentShader,
		});
	}
}
