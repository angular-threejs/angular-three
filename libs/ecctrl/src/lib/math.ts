import type { Vector as RapierVector } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

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
