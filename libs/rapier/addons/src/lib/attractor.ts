import { Directive, effect, ElementRef, inject, input, linkedSignal, untracked } from '@angular/core';
import { InteractionGroups, RigidBody } from '@dimforge/rapier3d-compat';
import { applyProps, NgtVector3, pick } from 'angular-three';
import { beforePhysicsStep, COLLISION_GROUPS_HANDLER } from 'angular-three-rapier';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { attractorDebug } from './attractor-debug';

/**
 * Force calculation functions for different gravity types.
 * - static: Constant force regardless of distance
 * - linear: Force increases linearly as distance decreases
 * - newtonian: Force follows Newton's law of universal gravitation
 */
const calcForceByType = {
	static: (s: number, m2: number, r: number, d: number, G: number) => s,
	linear: (s: number, m2: number, r: number, d: number, G: number) => s * (d / r),
	newtonian: (s: number, m2: number, r: number, d: number, G: number) => (G * s * m2) / Math.pow(d, 2),
};

const _position = new THREE.Vector3();
const _vector3 = new THREE.Vector3();

/**
 * Applies attractor force to a rigid body based on its distance from the attractor.
 * Used internally by NgtrAttractor but can be called manually for custom behavior.
 *
 * @param rigidBody - The rigid body to apply the force to
 * @param options - The attractor configuration including position, strength, and type
 *
 * @example
 * ```typescript
 * beforePhysicsStep((world) => {
 *   world.bodies.forEach((body) => {
 *     if (body.isDynamic()) {
 *       applyAttractorForceOnRigidBody(body, {
 *         object: attractorMesh,
 *         strength: 10,
 *         range: 20,
 *         type: 'newtonian',
 *         gravitationalConstant: 6.673e-11
 *       });
 *     }
 *   });
 * });
 * ```
 */
export function applyAttractorForceOnRigidBody(
	rigidBody: RigidBody,
	{
		object,
		strength,
		range,
		gravitationalConstant,
		collisionGroups,
		type,
	}: NgtrAttactorOptions & { object: THREE.Object3D },
) {
	const rbPosition = rigidBody.translation();
	_position.set(rbPosition.x, rbPosition.y, rbPosition.z);

	const worldPosition = object.getWorldPosition(new THREE.Vector3());

	const distance: number = worldPosition.distanceTo(_position);

	if (distance < range) {
		let force = calcForceByType[type](strength, rigidBody.mass(), range, distance, gravitationalConstant);

		// Prevent wild forces when Attractors collide
		force = force === Infinity ? strength : force;

		// Naively test if the rigidBody contains a collider in one of the collision groups
		let isRigidBodyInCollisionGroup = collisionGroups === undefined;
		if (collisionGroups !== undefined) {
			for (let i = 0; i < rigidBody.numColliders(); i++) {
				const collider = rigidBody.collider(i);
				const colliderCollisionGroups = collider.collisionGroups();
				if (
					((collisionGroups >> 16) & colliderCollisionGroups) != 0 &&
					((colliderCollisionGroups >> 16) & collisionGroups) != 0
				) {
					isRigidBodyInCollisionGroup = true;
					break;
				}
			}
		}

		if (isRigidBodyInCollisionGroup) {
			_vector3.set(0, 0, 0).subVectors(worldPosition, _position).normalize().multiplyScalar(force);

			rigidBody.applyImpulse(_vector3, true);
		}
	}
}

/**
 * Type of gravity calculation for attractors.
 * - `'static'` - Constant force regardless of distance
 * - `'linear'` - Force scales linearly with distance (closer = stronger)
 * - `'newtonian'` - Force follows Newton's law of universal gravitation (inverse square)
 */
export type NgtrAttractorGravityType = 'static' | 'linear' | 'newtonian';

/**
 * Configuration options for the attractor directive.
 */
export interface NgtrAttactorOptions {
	/**
	 * The strength of the attractor.
	 * Positive values attract, negative values repel.
	 *
	 * @defaultValue 1
	 */
	strength: number;

	/**
	 * The range of the attractor. Will not affect objects outside of this range.
	 *
	 * @defaultValue 10
	 * @min 0
	 */
	range: number;

	/**
	 * The type of gravity to use.
	 * - static: The gravity is constant and does not change over time.
	 * - linear: The gravity is linearly interpolated the closer the object is to the attractor.
	 * - newtonian: The gravity is calculated using the newtonian gravity formula.
	 * @defaultValue "static"
	 */
	type: NgtrAttractorGravityType;

	/**
	 * The mass of the attractor. Used when type is `newtonian`.
	 * @defaultValue 6.673e-11
	 */
	gravitationalConstant: number;

	/**
	 * The collision groups that this attractor will apply effects to. If a RigidBody contains one or more colliders that are in one of the mask group, it will be affected by this attractor.
	 * If not specified, the attractor will apply effects to all RigidBodies.
	 */
	collisionGroups?: InteractionGroups;
}

const defaultOptions: NgtrAttactorOptions = {
	strength: 1,
	range: 10,
	type: 'static',
	gravitationalConstant: 6.673e-11,
};

/**
 * Directive that creates a gravitational attractor point in the physics world.
 * All dynamic rigid bodies within range will be attracted (or repelled) towards this point.
 *
 * The attractor can use different gravity models:
 * - Static: constant force
 * - Linear: force increases as objects get closer
 * - Newtonian: realistic inverse-square law
 *
 * @example
 * ```html
 * <!-- Simple attractor at origin with default options -->
 * <ngt-object3D attractor />
 *
 * <!-- Attractor with custom options -->
 * <ngt-object3D [attractor]="{ strength: 5, range: 20 }" />
 *
 * <!-- Repeller (negative strength) -->
 * <ngt-object3D [attractor]="{ strength: -10, range: 15 }" [position]="[5, 0, 0]" />
 *
 * <!-- Newtonian gravity -->
 * <ngt-object3D [attractor]="{
 *   strength: 1000,
 *   range: 50,
 *   type: 'newtonian',
 *   gravitationalConstant: 0.01
 * }" />
 * ```
 */
@Directive({
	selector: 'ngt-object3D[attractor]',
	providers: [
		{
			provide: COLLISION_GROUPS_HANDLER,
			useFactory: (attractor: NgtrAttractor) => {
				return () => (interactionGroups: InteractionGroups) => {
					attractor.linkedCollisionGroups.set(interactionGroups);
				};
			},
			deps: [NgtrAttractor],
		},
	],
})
export class NgtrAttractor {
	position = input<NgtVector3>([0, 0, 0]);
	options = input(defaultOptions, { alias: 'attractor', transform: mergeInputs(defaultOptions) });

	private objectRef = inject<ElementRef<THREE.Object3D>>(ElementRef);
	private collisionGroups = pick(this.options, 'collisionGroups');
	linkedCollisionGroups = linkedSignal(this.collisionGroups);

	constructor() {
		effect(() => {
			applyProps(this.objectRef.nativeElement, { position: this.position() });
		});

		beforePhysicsStep((world) => {
			const { strength, range, type, gravitationalConstant } = untracked(this.options);
			const collisionGroups = untracked(this.linkedCollisionGroups);
			world.bodies.forEach((body) => {
				if (body.isDynamic()) {
					applyAttractorForceOnRigidBody(body, {
						object: this.objectRef.nativeElement,
						strength,
						range,
						type,
						gravitationalConstant,
						collisionGroups,
					});
				}
			});
		});

		attractorDebug(this.objectRef.nativeElement, this.options);
	}
}
