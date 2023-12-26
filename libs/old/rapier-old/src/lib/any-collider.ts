import { Component, Input } from '@angular/core';
import type { CoefficientCombineRule, InteractionGroups, Rotation, Vector } from '@dimforge/rapier3d-compat';
import { extend, injectNgtRef, signalStore, type NgtObject3D } from 'angular-three-old';
import { Object3D } from 'three';
import { injectNgtrPhysicsApi } from './physics';
import { injectNgtrRigidBodyApi } from './rigid-body';
import type {
	ColliderShape,
	CollisionEnterHandler,
	CollisionExitHandler,
	ContactForceHandler,
	IntersectionEnterHandler,
	IntersectionExitHandler,
	Vector3Tuple,
} from './types';

extend({ Object3D });

export type NgtrColliderOptions<ColliderArgs extends Array<unknown>> = {
	/**
	 * The optional name passed to THREE's Object3D
	 */
	name?: string;

	/**
	 * The shape of your collider
	 */
	shape?: ColliderShape;

	/**
	 * Arguments to pass to the collider
	 */
	args?: ColliderArgs;

	/**
	 * Principal angular inertia of this rigid body
	 */
	principalAngularInertia?: Vector3Tuple;

	/**
	 * Restitution controls how elastic (aka. bouncy) a contact is. Le elasticity of a contact is controlled by the restitution coefficient
	 */
	restitution?: number;

	/**
	 * What happens when two bodies meet. See https://rapier.rs/docs/user_guides/javascript/colliders#friction.
	 */
	restitutionCombineRule?: CoefficientCombineRule;

	/**
	 * Friction is a force that opposes the relative tangential motion between two rigid-bodies with colliders in contact.
	 * A friction coefficient of 0 implies no friction at all (completely sliding contact) and a coefficient
	 * greater or equal to 1 implies a very strong friction. Values greater than 1 are allowed.
	 */
	friction?: number;

	/**
	 * What happens when two bodies meet. See https://rapier.rs/docs/user_guides/javascript/colliders#friction.
	 */
	frictionCombineRule?: CoefficientCombineRule;

	/**
	 * The position of this collider relative to the rigid body
	 */
	position?: NgtObject3D['position'];

	/**
	 * The rotation of this collider relative to the rigid body
	 */
	rotation?: NgtObject3D['rotation'];

	/**
	 * The rotation, as a Quaternion, of this collider relative to the rigid body
	 */
	quaternion?: NgtObject3D['quaternion'];

	/**
	 * The scale of this collider relative to the rigid body
	 */
	scale?: NgtObject3D['scale'];

	/**
	 * Callback when this collider collides with another collider.
	 */
	onCollisionEnter?: CollisionEnterHandler;

	/**
	 * Callback when this collider stops colliding with another collider.
	 */
	onCollisionExit?: CollisionExitHandler;

	/**
	 * Callback when this collider, or another collider starts intersecting, and at least one of them is a `sensor`.
	 */
	onIntersectionEnter?: IntersectionEnterHandler;

	/**
	 * Callback when this, or another collider stops intersecting, and at least one of them is a `sensor`.
	 */
	onIntersectionExit?: IntersectionExitHandler;

	/**
	 * Callback when this, or another collider triggers a contact force event
	 */
	onContactForce?: ContactForceHandler;

	/**
	 * The bit mask configuring the groups and mask for collision handling.
	 */
	collisionGroups?: InteractionGroups;

	/**
	 * The bit mask configuring the groups and mask for solver handling.
	 */
	solverGroups?: InteractionGroups;

	/**
	 * Sets the uniform density of this collider.
	 * If this is set, other mass-properties like the angular inertia tensor are computed
	 * automatically from the collider's shape.
	 * Cannot be used at the same time as the mass or massProperties values.
	 * More info https://rapier.rs/docs/user_guides/javascript/colliders#mass-properties
	 */
	density?: number;

	/**
	 * The mass of this collider.
	 * Generally, it's not recommended to adjust the mass properties as it could lead to
	 * unexpected behaviors.
	 * Cannot be used at the same time as the density or massProperties values.
	 * More info https://rapier.rs/docs/user_guides/javascript/colliders#mass-properties
	 */
	mass?: number;

	/**
	 * The mass properties of this rigid body.
	 * Cannot be used at the same time as the density or mass values.
	 */
	massProperties?: {
		mass: number;
		centerOfMass: Vector;
		principalAngularInertia: Vector;
		angularInertiaLocalFrame: Rotation;
	};

	/**
	 * Sets whether or not this collider is a sensor.
	 */
	sensor?: boolean;
};

@Component({
	selector: 'ngtr-any-collider',
	standalone: true,
	template: `
		<ngt-object3D [ref]="objectRef">
			<ng-content />
		</ngt-object3D>
	`,
})
export class NgtrAnyCollider {
	private inputs = signalStore<NgtrColliderOptions<any>>();

	@Input() objectRef = injectNgtRef<Object3D>();

	private physicsApi = injectNgtrPhysicsApi();
	private rigidBodyApi = injectNgtrRigidBodyApi();
}

// const { children, position, rotation, quaternion, scale, name } = props;
// const { world, colliderEvents, colliderStates } = useRapier();
// const rigidBodyContext = useRigidBodyContext();
// const colliderRef = useForwardedRef(forwardedRef);
// const objectRef = useRef<Object3D>(null);
//
// // We spread the props out here to make sure that the ref is updated when the props change.
// const immutablePropArray = immutableColliderOptions.flatMap((key) =>
//   Array.isArray(props[key]) ? [...props[key]] : props[key]
// );
//
// const getInstance = useImperativeInstance(
//   () => {
//     const worldScale = objectRef.current!.getWorldScale(vec3());
//
//     const collider = createColliderFromOptions(
//       props,
//       world,
//       worldScale,
//       rigidBodyContext?.getRigidBody
//     );
//
//     if (typeof forwardedRef == "function") {
//       forwardedRef(collider);
//     }
//     colliderRef.current = collider;
//
//     return collider;
//   },
//   (collider) => {
//     if (world.getCollider(collider.handle)) {
//       world.removeCollider(collider, true);
//     }
//   },
//   [...immutablePropArray, rigidBodyContext]
// );
//
// useEffect(() => {
//   const collider = getInstance();
//
//   colliderStates.set(
//     collider.handle,
//     createColliderState(
//       collider,
//       objectRef.current!,
//       rigidBodyContext?.ref.current
//     )
//   );
//
//   return () => {
//     colliderStates.delete(collider.handle);
//   };
// }, [getInstance]);
//
// const mergedProps = useMemo(() => {
//   return {
//     ...cleanRigidBodyPropsForCollider(rigidBodyContext?.options),
//     ...props
//   };
// }, [props, rigidBodyContext?.options]);
//
// useUpdateColliderOptions(getInstance, mergedProps, colliderStates);
// useColliderEvents(
//   getInstance,
//   mergedProps,
//   colliderEvents,
//   getActiveCollisionEventsFromProps(rigidBodyContext?.options)
// );
//
// return (
//   <object3D
//     position={position}
//     rotation={rotation}
//     quaternion={quaternion}
//     scale={scale}
//     ref={objectRef}
//     name={name}
//   >
//     {children}
//   </object3D>
// );
