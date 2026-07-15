import { Directive, inject, Injectable, input, signal, untracked } from '@angular/core';
import type { RigidBody } from '@dimforge/rapier3d-compat';
import type { NgtVector3 } from 'angular-three';
import { beforePhysicsStep, NgtrRigidBody } from 'angular-three-rapier';
import * as THREE from 'three';

const DEFAULT_GRAVITY = new THREE.Vector3(0, -9.81, 0);

/** A Three.js vector or `[x, y, z]` tuple; scalar vector shorthand is excluded. */
export type NgteEcctrlGravityVector = Exclude<NgtVector3, number>;

/** Resolves gravity at a world-space position. */
export type NgteEcctrlGravityField = (position: THREE.Vector3) => NgteEcctrlGravityVector;

export interface NgteEcctrlGravityBodyOptions {
	enabled?: boolean;
	gravityScale?: number;
	/** Overrides the scene-wide field for this body. */
	gravityField?: NgteEcctrlGravityField;
}

function copyGravity(value: NgteEcctrlGravityVector, target: THREE.Vector3) {
	if (Array.isArray(value)) target.set(value[0], value[1], value[2]);
	else target.set(value.x, value.y, value.z);
	return target;
}

function toRapierVector(value: THREE.Vector3) {
	return { x: value.x, y: value.y, z: value.z };
}

/** Position-dependent gravity shared by Ecctrl controllers and arbitrary Rapier bodies. */
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

	/** Applies this field as an impulse for one physics substep. */
	applyGravityField(
		body: RigidBody,
		delta: number,
		position: THREE.Vector3,
		gravityScale = body.gravityScale(),
		target = new THREE.Vector3(),
	) {
		if (!Number.isFinite(delta) || delta <= 0 || body.isSleeping() || gravityScale === 0) {
			return target.set(0, 0, 0);
		}

		this.resolveGravity(position, target).multiplyScalar(body.mass() * gravityScale * delta);
		body.applyImpulse(toRapierVector(target), false);
		return target;
	}
}

/**
 * Applies the configured Ecctrl gravity field to an arbitrary Rapier rigid body.
 * This adds an impulse without changing Rapier's native gravity; set the parent
 * physics world's gravity to zero when the field should replace world gravity.
 */
@Directive({
	selector: 'ngt-object3D[rigidBody][ecctrlGravity]',
})
export class NgteEcctrlGravityBody {
	options = input<NgteEcctrlGravityBodyOptions>({}, { alias: 'ecctrlGravity' });

	private readonly rigidBody = inject(NgtrRigidBody, { host: true });
	private readonly gravity = inject(NgteEcctrlGravity);
	private readonly position = new THREE.Vector3();
	private readonly impulse = new THREE.Vector3();

	constructor() {
		beforePhysicsStep((world, delta) => {
			const body = this.rigidBody.rigidBody();
			const options = untracked(this.options);
			const step = delta ?? world.timestep;
			if (!body || options.enabled === false || !Number.isFinite(step) || step <= 0) return;

			const gravityScale = options.gravityScale ?? body.gravityScale();
			if (options.gravityField) {
				const translation = body.translation();
				this.position.set(translation.x, translation.y, translation.z);
				copyGravity(options.gravityField(this.position), this.impulse).multiplyScalar(
					body.mass() * gravityScale * step,
				);
				if (!body.isSleeping() && gravityScale !== 0) body.applyImpulse(toRapierVector(this.impulse), false);
				return;
			}

			const translation = body.translation();
			this.position.set(translation.x, translation.y, translation.z);
			this.gravity.applyGravityField(body, step, this.position, gravityScale, this.impulse);
		});
	}
}
