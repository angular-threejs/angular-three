import * as THREE from 'three';
import { bakeCurveLut, evaluateCurveLut, slerpUnitVector } from './math';
import { DEFAULT_ECCTRL_OPTIONS } from './types';

describe('Ecctrl curve LUT', () => {
	it('matches the upstream default flat-then-smooth mass-ratio falloff', () => {
		const lut = bakeCurveLut(DEFAULT_ECCTRL_OPTIONS.massRatioFallOffCurveData);

		expect(evaluateCurveLut(lut, 0)).toBe(0);
		expect(evaluateCurveLut(lut, 0.5)).toBeCloseTo(0, 2);
		expect(evaluateCurveLut(lut, 0.75)).toBeCloseTo(0.5, 2);
		expect(evaluateCurveLut(lut, 1)).toBe(1);
	});

	it('supports linear tangent blends and clamps beyond the curve domain', () => {
		const lut = bakeCurveLut({
			points: [
				{ x: 0, y: 2, w_out: 0 },
				{ x: 2, y: 6, w_in: 0 },
			],
			samples: 9,
		});

		expect(evaluateCurveLut(lut, -1)).toBe(2);
		expect(evaluateCurveLut(lut, 1)).toBeCloseTo(4, 5);
		expect(evaluateCurveLut(lut, 3)).toBe(6);
	});

	it('rejects curve data with fewer than two points', () => {
		expect(() => bakeCurveLut({ points: [{ x: 0, y: 0 }] })).toThrow(/at least two points/i);
	});

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
