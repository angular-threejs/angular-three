import * as THREE from 'three';
import { slerpUnitVector } from './math';

describe(slerpUnitVector.name, () => {
	it('keeps gravity direction normalized through an antipodal transition', () => {
		const result = slerpUnitVector(
			new THREE.Vector3(0, -1, 0),
			new THREE.Vector3(0, 1, 0),
			0.5,
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3(),
		);

		expect(result.length()).toBeCloseTo(1);
		expect(Math.abs(result.dot(new THREE.Vector3(0, -1, 0)))).toBeLessThan(0.01);
	});
});
