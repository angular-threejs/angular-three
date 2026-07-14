import type { Vector as RapierVector } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import type { NgteEcctrlCurveData, NgteEcctrlCurvePoint } from './types';

/** Copies a Rapier vector into a reusable Three.js vector. */
export function fromRapierVector(value: RapierVector, target: THREE.Vector3) {
	return target.set(value.x, value.y, value.z);
}

/** Creates a Rapier-compatible vector without allocating an extra Three object. */
export function toRapierVector(value: THREE.Vector3) {
	return { x: value.x, y: value.y, z: value.z };
}

/**
 * Spherically interpolates unit vectors while handling a 180° gravity flip.
 *
 * `referenceAxis` supplies a stable rotation plane for antipodal vectors. The
 * scratch vectors keep this suitable for the physics hot path.
 */
export function slerpUnitVector(
	start: THREE.Vector3,
	end: THREE.Vector3,
	percent: number,
	referenceAxis: THREE.Vector3,
	result: THREE.Vector3,
	startScratch: THREE.Vector3,
	relativeScratch: THREE.Vector3,
) {
	startScratch.copy(start);
	if (startScratch.lengthSq() < 1e-12) return result.copy(end).normalize();
	if (end.lengthSq() < 1e-12) return result.copy(startScratch).normalize();

	startScratch.normalize();
	const endLength = end.length();
	const dot = THREE.MathUtils.clamp(startScratch.dot(end) / endLength, -1, 1);
	const clampedPercent = THREE.MathUtils.clamp(percent, 0, 1);

	if (Math.abs(dot + 1) < 0.001) {
		if (Math.abs(referenceAxis.dot(startScratch)) < 0.99) relativeScratch.copy(referenceAxis).normalize();
		else if (Math.abs(startScratch.y) > 0.99) relativeScratch.set(1, 0, 0);
		else if (Math.abs(startScratch.x) > 0.99) relativeScratch.set(0, 1, 0);
		else relativeScratch.set(0, 0, 1);

		relativeScratch.cross(startScratch).normalize();
		const theta = Math.PI * clampedPercent;
		return result
			.copy(startScratch)
			.multiplyScalar(Math.cos(theta))
			.addScaledVector(relativeScratch, Math.sin(theta))
			.normalize();
	}

	const theta = Math.acos(dot) * clampedPercent;
	relativeScratch.copy(end).normalize().addScaledVector(startScratch, -dot).normalize();
	return result
		.copy(startScratch)
		.multiplyScalar(Math.cos(theta))
		.addScaledVector(relativeScratch, Math.sin(theta))
		.normalize();
}

/** Projects a vector onto the plane orthogonal to a normalized normal. */
export function projectOnPlane(value: THREE.Vector3, normal: THREE.Vector3, result: THREE.Vector3) {
	return result.copy(value).addScaledVector(normal, -value.dot(normal));
}

/** A baked, interpolation-friendly version of Ecctrl's weighted Hermite curve. */
export interface NgteEcctrlCurveLut {
	min: number;
	max: number;
	values: Float32Array;
}

/**
 * Bakes Ecctrl's curve-point format to a uniformly sampled lookup table.
 *
 * This mirrors upstream's `CurveLUT`: points are sorted by x, tangent angles
 * are converted with `tan`, and the result is sampled uniformly before runtime
 * interpolation.
 */
export function bakeCurveLut({ points, samples = 50 }: NgteEcctrlCurveData): NgteEcctrlCurveLut {
	const sorted = [...points].sort((a, b) => a.x - b.x);
	if (sorted.length < 2) {
		throw new Error('[NGTE Ecctrl] massRatioFallOffCurveData requires at least two points.');
	}

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

/** Evaluates a baked Ecctrl curve, clamping outside the source domain. */
export function evaluateCurveLut({ min, max, values }: NgteEcctrlCurveLut, value: number) {
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
	if (width <= 0) return next.y;

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
