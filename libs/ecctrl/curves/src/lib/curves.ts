import * as THREE from 'three';

/** A point in Ecctrl's weighted cubic-Hermite curve format. */
export interface NgteEcctrlCurvePoint {
	x: number;
	y: number;
	/** Incoming tangent angle in radians. */
	r_in?: number;
	/** Outgoing tangent angle in radians. */
	r_out?: number;
	/** Incoming tangent blend: `0` is linear, `1` uses the angle-derived tangent. */
	w_in?: number;
	/** Outgoing tangent blend: `0` is linear, `1` uses the angle-derived tangent. */
	w_out?: number;
}

/** Serializable curve data shared by Ecctrl features. */
export interface NgteEcctrlCurveData {
	points: ReadonlyArray<NgteEcctrlCurvePoint>;
	/** Number of uniformly spaced LUT samples. */
	samples?: number;
}

/** A baked, interpolation-friendly Ecctrl curve. */
export interface NgteEcctrlCurveLut {
	min: number;
	max: number;
	values: Float32Array;
}

/**
 * Bakes Ecctrl's curve-point format to a uniformly sampled lookup table.
 * Points are sorted by x and tangent angles are interpreted in radians.
 */
export function bakeCurveLut({ points, samples = 50 }: NgteEcctrlCurveData): NgteEcctrlCurveLut {
	const sorted = [...points].sort((a, b) => a.x - b.x);
	if (sorted.length < 2) throw new Error('[NGTE Ecctrl] curve data requires at least two points.');

	const min = sorted[0].x;
	const max = sorted[sorted.length - 1].x;
	const count = Math.max(2, Math.floor(samples));
	const values = new Float32Array(count);

	for (let index = 0; index < count; index++) {
		const value = min + ((max - min) * index) / (count - 1);
		values[index] = evaluateCurveSegments(sorted, value);
	}

	return { min, max, values };
}

/** Evaluates a baked curve, clamping outside the source domain. */
export function evaluateCurveLut({ min, max, values }: NgteEcctrlCurveLut, value: number) {
	if (values.length === 0) throw new Error('[NGTE Ecctrl] cannot evaluate an empty curve LUT.');
	if (value <= min || max <= min) return values[0];
	if (value >= max) return values[values.length - 1];

	const progress = ((value - min) / (max - min)) * (values.length - 1);
	const index = Math.floor(progress);
	return THREE.MathUtils.lerp(values[index], values[Math.min(index + 1, values.length - 1)], progress - index);
}

function evaluateCurveSegments(points: NgteEcctrlCurvePoint[], value: number) {
	if (value <= points[0].x) return points[0].y;

	for (let index = 1; index < points.length; index++) {
		const previous = points[index - 1];
		const next = points[index];
		if (value <= next.x) return evaluateHermiteSegment(previous, next, value);
	}

	return points[points.length - 1].y;
}

function evaluateHermiteSegment(previous: NgteEcctrlCurvePoint, next: NgteEcctrlCurvePoint, value: number) {
	const width = next.x - previous.x;
	if (width <= 0) return previous.y;

	const t = THREE.MathUtils.clamp((value - previous.x) / width, 0, 1);
	const t2 = t * t;
	const t3 = t2 * t;
	const linearSlope = (next.y - previous.y) / width;
	const outgoingSlope =
		linearSlope +
		((previous.r_out === undefined ? 0 : Math.tan(previous.r_out)) - linearSlope) * (previous.w_out ?? 1);
	const incomingSlope =
		linearSlope + ((next.r_in === undefined ? 0 : Math.tan(next.r_in)) - linearSlope) * (next.w_in ?? 1);

	return (
		(2 * t3 - 3 * t2 + 1) * previous.y +
		(t3 - 2 * t2 + t) * width * outgoingSlope +
		(-2 * t3 + 3 * t2) * next.y +
		(t3 - t2) * width * incomingSlope
	);
}
