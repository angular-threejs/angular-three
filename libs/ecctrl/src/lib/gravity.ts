import { Injectable, signal } from '@angular/core';
import type { RigidBody } from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { toRapierVector } from './math';
import type { NgteEcctrlGravityField, NgteEcctrlGravityVector } from './types';

const DEFAULT_GRAVITY = new THREE.Vector3(0, -9.81, 0);

function copyGravity(value: NgteEcctrlGravityVector, target: THREE.Vector3) {
	if (Array.isArray(value)) {
		target.set(value[0], value[1], value[2]);
	} else {
		target.set(value.x, value.y, value.z);
	}
	return target;
}

/**
 * Position-dependent gravity shared by Ecctrl controllers.
 *
 * Inject this service and call `setGravityField` to supply a scene-wide gravity
 * field. A controller's `options.gravityField` takes precedence, and
 * `options.customGravity` remains available as a convenient constant-vector
 * shorthand.
 */
@Injectable({ providedIn: 'root' })
export class NgteEcctrlGravity {
	private readonly field = signal<NgteEcctrlGravityField>(() => DEFAULT_GRAVITY);
	readonly gravityField = this.field.asReadonly();

	setGravityField(field: NgteEcctrlGravityField) {
		this.field.set(field);
	}

	/** Resolves the configured gravity at `position` into `target`. */
	resolveGravity(position: THREE.Vector3, target = new THREE.Vector3()) {
		return copyGravity(this.field()(position), target);
	}

	/**
	 * Applies the configured field as an impulse for one physics substep.
	 * Sleeping bodies are deliberately left asleep, matching Ecctrl's controller
	 * maintenance behavior.
	 */
	applyGravityField(
		body: RigidBody,
		delta: number,
		position: THREE.Vector3,
		gravityScale = body.gravityScale(),
		target = new THREE.Vector3(),
	) {
		if (body.isSleeping() || gravityScale === 0) return target.set(0, 0, 0);

		this.resolveGravity(position, target).multiplyScalar(body.mass() * gravityScale * delta);
		body.applyImpulse(toRapierVector(target), false);
		return target;
	}
}
