import { DEFAULT_ECCTRL_OPTIONS } from 'angular-three-ecctrl';
import { bakeCurveLut, evaluateCurveLut } from './curves';

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

	it('rejects invalid curve and LUT data', () => {
		expect(() => bakeCurveLut({ points: [{ x: 0, y: 0 }] })).toThrow(/at least two points/i);
		expect(() => evaluateCurveLut({ min: 0, max: 1, values: new Float32Array() }, 0.5)).toThrow(/empty/i);
	});

	it('keeps the earlier value when adjacent points overlap', () => {
		const lut = bakeCurveLut({
			points: [
				{ x: 0, y: 2 },
				{ x: 0, y: 8 },
				{ x: 1, y: 10 },
			],
			samples: 3,
		});

		expect(evaluateCurveLut(lut, 0)).toBe(2);
	});
});
