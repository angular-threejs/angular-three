import { normalizeCurveData, updateCurveTangent, type TweakpaneCurveData } from './curve';

describe(normalizeCurveData.name, () => {
	it('uses zero-to-one bounds by default', () => {
		expect(
			normalizeCurveData({
				points: [
					{ x: -1, y: 2, r_out: 0 },
					{ x: 2, y: -1, r_in: 0 },
				],
			}),
		).toEqual({
			points: [
				{ x: 0, y: 1, r_out: 0 },
				{ x: 1, y: 0, r_in: 0 },
			],
		});
	});

	it('clamps and sorts points while preserving curve metadata', () => {
		const value: TweakpaneCurveData = {
			samples: 80,
			points: [
				{ x: 2, y: -1, r_in: 0.5 },
				{ x: -1, y: 2, w_out: 0.25 },
			],
		};

		expect(normalizeCurveData(value, { minX: 0, maxX: 1, minY: 0, maxY: 1 })).toEqual({
			samples: 80,
			points: [
				{ x: 0, y: 1, w_out: 0.25 },
				{ x: 1, y: 0, r_in: 0.5 },
			],
		});
	});
});

describe(updateCurveTangent.name, () => {
	it('authors outgoing and incoming tangent angles and weights without mutating the source', () => {
		const points = [
			{ x: 0, y: 0, r_out: 0, w_out: 1 },
			{ x: 0.5, y: 0.5, r_in: 0, w_in: 1, r_out: 0, w_out: 1 },
			{ x: 1, y: 1, r_in: 0, w_in: 1 },
		];
		const params = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
		const distance = 0.18 * 2;
		const component = Math.SQRT1_2 * distance;

		const outgoing = updateCurveTangent(points, 1, 'out', { x: 0.5 + component, y: 0.5 + component }, params);
		expect(outgoing[1].r_out).toBeCloseTo(Math.PI / 4);
		expect(outgoing[1].w_out).toBeCloseTo(2);

		const incoming = updateCurveTangent(outgoing, 1, 'in', { x: 0.5 - component, y: 0.5 - component }, params);
		expect(incoming[1].r_in).toBeCloseTo(Math.PI / 4);
		expect(incoming[1].w_in).toBeCloseTo(2);
		expect(points[1]).toEqual({ x: 0.5, y: 0.5, r_in: 0, w_in: 1, r_out: 0, w_out: 1 });
	});
});
