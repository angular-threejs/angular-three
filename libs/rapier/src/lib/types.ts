import type { Collider, RigidBody, TempContactManifold, Vector } from '@dimforge/rapier3d-compat';
import type { Object3D } from 'three';

export type RigidBodyAutoCollider = 'ball' | 'cuboid' | 'hull' | 'trimesh' | false;

export type Vector3Tuple = [x: number, y: number, z: number];
export type Vector4Tuple = [x: number, y: number, z: number, w: number];
export type Boolean3Tuple = [x: boolean, y: boolean, z: boolean];
export type Vector3Object = { x: number; y: number; z: number };

export type ColliderShape =
	| 'cuboid'
	| 'trimesh'
	| 'ball'
	| 'capsule'
	| 'convexHull'
	| 'heightfield'
	| 'polyline'
	| 'roundCuboid'
	| 'cylinder'
	| 'roundCylinder'
	| 'cone'
	| 'roundCone'
	| 'convexMesh'
	| 'roundConvexHull'
	| 'roundConvexMesh';

export type CollisionTarget = {
	rigidBody?: RigidBody;
	collider: Collider;
	rigidBodyObject?: Object3D;
	colliderObject?: Object3D;
};

export type CollisionPayload = {
	/** the object firing the event */
	target: CollisionTarget;
	/** the other object involved in the event */
	other: CollisionTarget;

	/** deprecated use `payload.other.rigidBody` instead */
	rigidBody?: RigidBody;
	/** deprecated use `payload.other.collider` instead */
	collider: Collider;
	/** deprecated use `payload.other.rigidBodyObject` instead */
	rigidBodyObject?: Object3D;
	/** deprecated use `payload.other.colliderObject` instead */
	colliderObject?: Object3D;
};

export type CollisionEnterPayload = CollisionPayload & {
	manifold: TempContactManifold;
	flipped: boolean;
};

export type CollisionExitPayload = CollisionPayload;

export type IntersectionEnterPayload = CollisionPayload;

export type IntersectionExitPayload = CollisionPayload;

export type ContactForcePayload = CollisionPayload & {
	totalForce: Vector;
	totalForceMagnitude: number;
	maxForceDirection: Vector;
	maxForceMagnitude: number;
};

export type CollisionEnterHandler = (payload: CollisionEnterPayload) => void;

export type CollisionExitHandler = (payload: CollisionExitPayload) => void;

export type IntersectionEnterHandler = (payload: IntersectionEnterPayload) => void;

export type IntersectionExitHandler = (payload: IntersectionExitPayload) => void;

export type ContactForceHandler = (payload: ContactForcePayload) => void;
