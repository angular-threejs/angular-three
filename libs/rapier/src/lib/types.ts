import type {
	ActiveCollisionTypes,
	CoefficientCombineRule,
	Collider,
	ColliderHandle,
	InteractionGroups,
	RigidBody,
	RigidBodyHandle,
	Rotation,
	SolverFlags,
	TempContactManifold,
	Vector,
	World,
} from '@dimforge/rapier3d-compat';
import type { NgtQuaternion, NgtThreeElements, NgtVector3 } from 'angular-three';
import type * as THREE from 'three';

/**
 * Type of automatic collider generation for rigid bodies.
 *
 * - `'ball'` - Generates a spherical collider based on the bounding sphere
 * - `'cuboid'` - Generates a box collider based on the bounding box
 * - `'hull'` - Generates a convex hull collider from the mesh vertices
 * - `'trimesh'` - Generates a triangle mesh collider (exact shape, most expensive)
 * - `false` - Disables automatic collider generation
 */
export type NgtrRigidBodyAutoCollider = 'ball' | 'cuboid' | 'hull' | 'trimesh' | false;

export interface NgtrPhysicsOptions {
	/**
	 * Set the gravity of the physics world
	 * @defaultValue [0, -9.81, 0]
	 */
	gravity: THREE.Vector3Tuple;

	/**
	 * Amount of penetration the engine wont attempt to correct
	 * @defaultValue 0.001
	 */
	allowedLinearError: number;

	/**
	 * The number of solver iterations run by the constraints solver for calculating forces.
	 * The greater this value is, the most rigid and realistic the physics simulation will be.
	 * However a greater number of iterations is more computationally intensive.
	 *
	 * @defaultValue 4
	 */
	numSolverIterations: number;

	/**
	 * Number of internal Project Gauss Seidel (PGS) iterations run at each solver iteration.
	 * Increasing this parameter will improve stability of the simulation. It will have a lesser effect than
	 * increasing `numSolverIterations` but is also less computationally expensive.
	 *
	 * @defaultValue 1
	 */
	numInternalPgsIterations: number;

	/**
	 * The maximal distance separating two objects that will generate predictive contacts
	 *
	 * @defaultValue 0.002
	 *
	 */
	predictionDistance: number;

	/**
	 * Minimum number of dynamic bodies in each active island
	 *
	 * @defaultValue 128
	 */
	minIslandSize: number;

	/**
	 * Maximum number of substeps performed by the solver
	 *
	 * @defaultValue 1
	 */
	maxCcdSubsteps: number;

	/**
	 * Directly affects the erp (Error Reduction Parameter) which is the proportion (between 0 and 1) of the positional error to be corrected at each time step.
	 *
	 * The higher the value, the more the physics engine will try to correct the positional error.
	 *
	 * This property is currently undocumented in rapier docs.
	 *
	 * @defaultValue 30
	 */
	contactNaturalFrequency: number;

	/**
	 * The approximate size of most dynamic objects in the scene.
	 *
	 * This value is used internally to estimate some length-based tolerance.
	 * This value can be understood as the number of units-per-meter in your physical world compared to a human-sized world in meter.
	 *
	 * @defaultValue 1
	 */
	lengthUnit: number;

	/**
	 * Set the base automatic colliders for this physics world
	 * All Meshes inside RigidBodies will generate a collider
	 * based on this value, if not overridden.
	 */
	colliders?: NgtrRigidBodyAutoCollider;

	/**
	 * Set the timestep for the simulation.
	 * Setting this to a number (eg. 1/60) will run the
	 * simulation at that framerate. Alternatively, you can set this to
	 * "vary", which will cause the simulation to always synchronize with
	 * the current frame delta times.
	 *
	 * @defaultValue 1/60
	 */
	timeStep: number | 'vary';

	/**
	 * Pause the physics simulation
	 *
	 * @defaultValue false
	 */
	paused: boolean;

	/**
	 * Interpolate the world transform using the frame delta times.
	 * Has no effect if timeStep is set to "vary".
	 *
	 * @defaultValue true
	 **/
	interpolate: boolean;

	/**
	 * The update priority at which the physics simulation should run.
	 * Only used when `updateLoop` is set to "follow".
	 *
	 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#taking-over-the-render-loop
	 * @defaultValue undefined
	 */
	updatePriority?: number;

	/**
	 * Set the update loop strategy for the physics world.
	 *
	 * If set to "follow", the physics world will be stepped
	 * in a `useFrame` callback, managed by @react-three/fiber.
	 * You can use `updatePriority` prop to manage the scheduling.
	 *
	 * If set to "independent", the physics world will be stepped
	 * in a separate loop, not tied to the render loop.
	 * This is useful when using the "demand" `frameloop` strategy for the
	 * @react-three/fiber `<Canvas />`.
	 *
	 * @see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#on-demand-rendering
	 * @defaultValue "follow"
	 */
	updateLoop: 'follow' | 'independent';

	/**
	 * Enable debug rendering of the physics world.
	 * @defaultValue false
	 */
	debug: boolean;
}

/**
 * Internal state tracking for a rigid body in the physics simulation.
 * Used by the physics system to synchronize Three.js objects with Rapier physics bodies.
 */
export interface NgtrRigidBodyState {
	/** The type of mesh associated with this rigid body */
	meshType: 'instancedMesh' | 'mesh';
	/** The underlying Rapier rigid body instance */
	rigidBody: RigidBody;
	/** The Three.js Object3D representing this rigid body */
	object: THREE.Object3D;
	/** Inverted world matrix for coordinate transformations */
	invertedWorldMatrix: THREE.Matrix4;
	/** Function to set the object's transformation matrix */
	setMatrix: (matrix: THREE.Matrix4) => void;
	/** Function to get the object's transformation matrix */
	getMatrix: (matrix: THREE.Matrix4) => THREE.Matrix4;
	/**
	 * The world scale of the object.
	 * Required for instanced rigid bodies.
	 */
	scale: THREE.Vector3;
	/** Whether the rigid body is currently sleeping (inactive) */
	isSleeping: boolean;
}

/**
 * Map storing rigid body states indexed by their handle.
 */
export type NgtrRigidBodyStateMap = Map<RigidBody['handle'], NgtrRigidBodyState>;

/**
 * Internal state tracking for a collider in the physics simulation.
 * Used by the physics system to synchronize Three.js objects with Rapier colliders.
 */
export interface NgtrColliderState {
	/** The underlying Rapier collider instance */
	collider: Collider;
	/** The Three.js Object3D representing this collider */
	object: THREE.Object3D;

	/**
	 * The parent of which this collider needs to base its
	 * world position on, can be empty
	 */
	worldParent?: THREE.Object3D;
}

/**
 * Map storing collider states indexed by their handle.
 */
export type NgtrColliderStateMap = Map<Collider['handle'], NgtrColliderState>;

/**
 * Represents a collision target with references to both the physics objects
 * and their corresponding Three.js representations.
 */
export interface NgtrCollisionTarget {
	/** The Rapier rigid body involved in the collision (if any) */
	rigidBody?: RigidBody;
	/** The Rapier collider involved in the collision */
	collider: Collider;
	/** The Three.js Object3D representing the rigid body */
	rigidBodyObject?: THREE.Object3D;
	/** The Three.js Object3D representing the collider */
	colliderObject?: THREE.Object3D;
}

/**
 * Base payload for collision events containing references to both objects involved.
 */
export interface NgtrCollisionPayload {
	/** The object firing the event */
	target: NgtrCollisionTarget;
	/** The other object involved in the event */
	other: NgtrCollisionTarget;
}

/**
 * Payload for collision enter events, includes contact manifold information.
 */
export interface NgtrCollisionEnterPayload extends NgtrCollisionPayload {
	/** The contact manifold containing contact point information */
	manifold: TempContactManifold;
	/** Whether the collision pair order was flipped */
	flipped: boolean;
}

/**
 * Payload for collision exit events.
 */
export interface NgtrCollisionExitPayload extends NgtrCollisionPayload {}

/**
 * Payload for sensor intersection enter events.
 */
export interface NgtrIntersectionEnterPayload extends NgtrCollisionPayload {}

/**
 * Payload for sensor intersection exit events.
 */
export interface NgtrIntersectionExitPayload extends NgtrCollisionPayload {}

/**
 * Payload for contact force events, includes force magnitude and direction information.
 */
export interface NgtrContactForcePayload extends NgtrCollisionPayload {
	/** The total force vector applied during contact */
	totalForce: Vector;
	/** The magnitude of the total force */
	totalForceMagnitude: number;
	/** The direction of the maximum force component */
	maxForceDirection: Vector;
	/** The magnitude of the maximum force component */
	maxForceMagnitude: number;
}

/**
 * Handler function for collision enter events.
 * @param payload - The collision enter event payload
 */
export type NgtrCollisionEnterHandler = (payload: NgtrCollisionEnterPayload) => void;

/**
 * Handler function for collision exit events.
 * @param payload - The collision exit event payload
 */
export type NgtrCollisionExitHandler = (payload: NgtrCollisionExitPayload) => void;

/**
 * Handler function for intersection enter events (sensors).
 * @param payload - The intersection enter event payload
 */
export type NgtrIntersectionEnterHandler = (payload: NgtrIntersectionEnterPayload) => void;

/**
 * Handler function for intersection exit events (sensors).
 * @param payload - The intersection exit event payload
 */
export type NgtrIntersectionExitHandler = (payload: NgtrIntersectionExitPayload) => void;

/**
 * Handler function for contact force events.
 * @param payload - The contact force event payload
 */
export type NgtrContactForceHandler = (payload: NgtrContactForcePayload) => void;

/**
 * Collection of event handlers for physics events on rigid bodies and colliders.
 */
export interface NgtrEventMapValue {
	/** Called when the rigid body enters sleep state */
	onSleep?(): void;
	/** Called when the rigid body wakes from sleep state */
	onWake?(): void;
	/** Called when a collision starts */
	onCollisionEnter?: NgtrCollisionEnterHandler;
	/** Called when a collision ends */
	onCollisionExit?: NgtrCollisionExitHandler;
	/** Called when a sensor intersection starts */
	onIntersectionEnter?: NgtrIntersectionEnterHandler;
	/** Called when a sensor intersection ends */
	onIntersectionExit?: NgtrIntersectionExitHandler;
	/** Called when contact forces are applied */
	onContactForce?: NgtrContactForceHandler;
}

/**
 * Map storing event handlers indexed by collider or rigid body handle.
 */
export type NgtrEventMap = Map<ColliderHandle | RigidBodyHandle, NgtrEventMapValue>;

/**
 * Callback function invoked during physics world step.
 * @param world - The Rapier physics world instance
 */
export type NgtrWorldStepCallback = (world: World) => void;

/**
 * Callback to filter contact pairs and determine solver behavior.
 *
 * @param collider1 - Handle of the first collider
 * @param collider2 - Handle of the second collider
 * @param body1 - Handle of the first rigid body
 * @param body2 - Handle of the second rigid body
 * @returns SolverFlags to control collision response, or null to skip this hook
 *
 * @see https://rapier.rs/docs/user_guides/javascript/advanced_collision_detection#contact-and-intersection-filtering
 */
export type NgtrFilterContactPairCallback = (
	collider1: ColliderHandle,
	collider2: ColliderHandle,
	body1: RigidBodyHandle,
	body2: RigidBodyHandle,
) => SolverFlags | null;

/**
 * Callback to filter intersection pairs for sensors.
 *
 * @param collider1 - Handle of the first collider
 * @param collider2 - Handle of the second collider
 * @param body1 - Handle of the first rigid body
 * @param body2 - Handle of the second rigid body
 * @returns true to allow intersection detection, false to block it
 *
 * @see https://rapier.rs/docs/user_guides/javascript/advanced_collision_detection#contact-and-intersection-filtering
 */
export type NgtrFilterIntersectionPairCallback = (
	collider1: ColliderHandle,
	collider2: ColliderHandle,
	body1: RigidBodyHandle,
	body2: RigidBodyHandle,
) => boolean;

/**
 * Internal structure representing a collision source with its associated
 * physics objects, events, and states.
 */
export interface NgtrCollisionSource {
	/** The collider information */
	collider: {
		/** The Rapier collider object */
		object: Collider;
		/** Event handlers for this collider */
		events?: NgtrEventMapValue;
		/** State tracking for this collider */
		state?: NgtrColliderState;
	};
	/** The rigid body information (if any) */
	rigidBody: {
		/** The Rapier rigid body object */
		object?: RigidBody;
		/** Event handlers for this rigid body */
		events?: NgtrEventMapValue;
		/** State tracking for this rigid body */
		state?: NgtrRigidBodyState;
	};
}

/**
 * Available collider shape types in Rapier.
 *
 * - `'cuboid'` - Box shape with half-extents
 * - `'ball'` - Sphere shape with radius
 * - `'capsule'` - Capsule shape with half-height and radius
 * - `'cylinder'` - Cylinder shape with half-height and radius
 * - `'cone'` - Cone shape with half-height and radius
 * - `'convexHull'` - Convex hull computed from vertices
 * - `'convexMesh'` - Convex mesh from vertices and indices
 * - `'trimesh'` - Triangle mesh (exact collision shape)
 * - `'heightfield'` - Height field terrain
 * - `'polyline'` - Polyline shape
 * - `'roundCuboid'` - Cuboid with rounded corners
 * - `'roundCylinder'` - Cylinder with rounded edges
 * - `'roundCone'` - Cone with rounded edges
 * - `'roundConvexHull'` - Convex hull with rounded edges
 * - `'roundConvexMesh'` - Convex mesh with rounded edges
 */
export type NgtrColliderShape =
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

/**
 * Configuration options for colliders.
 * These options control the physical properties of colliders.
 */
export interface NgtrColliderOptions {
	/**
	 * The optional name passed to THREE's Object3D
	 */
	name?: string;

	/**
	 * Principal angular inertia of this rigid body
	 */
	principalAngularInertia?: THREE.Vector3Tuple;

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
	 * The bit mask configuring the groups and mask for collision handling.
	 */
	collisionGroups?: InteractionGroups;

	/**
	 * The bit mask configuring the groups and mask for solver handling.
	 */
	solverGroups?: InteractionGroups;

	/**
	 * The collision types active for this collider.
	 *
	 * Use `ActiveCollisionTypes` to specify which collision types should be active for this collider.
	 *
	 * @see https://rapier.rs/javascript3d/classes/Collider.html#setActiveCollisionTypes
	 * @see https://rapier.rs/javascript3d/enums/ActiveCollisionTypes.html
	 */
	activeCollisionTypes?: ActiveCollisionTypes;

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
	 * The contact skin of the collider.
	 *
	 * The contact skin acts as if the collider was enlarged with a skin of width contactSkin around it, keeping objects further apart when colliding.
	 *
	 * A non-zero contact skin can increase performance, and in some cases, stability.
	 * However it creates a small gap between colliding object (equal to the sum of their skin).
	 * If the skin is sufficiently small, this might not be visually significant or can be hidden by the rendering assets.
	 *
	 * @defaultValue 0
	 */
	contactSkin: number;

	/**
	 * Sets whether or not this collider is a sensor.
	 */
	sensor?: boolean;
}

/**
 * Type of rigid body determining its behavior in the physics simulation.
 *
 * - `'dynamic'` - Fully simulated body affected by forces and collisions
 * - `'fixed'` - Static body that doesn't move but can be collided with
 * - `'kinematicPosition'` - User-controlled body moved by setting position
 * - `'kinematicVelocity'` - User-controlled body moved by setting velocity
 */
export type NgtrRigidBodyType = 'fixed' | 'dynamic' | 'kinematicPosition' | 'kinematicVelocity';

/**
 * Configuration options for rigid bodies.
 * Extends collider options with additional physics simulation properties.
 */
export interface NgtrRigidBodyOptions extends NgtrColliderOptions {
	/**
	 * Whether or not this body can sleep.
	 * @defaultValue true
	 */
	canSleep: boolean;

	/** The linear damping coefficient of this rigid-body.*/
	linearDamping?: number;

	/** The angular damping coefficient of this rigid-body.*/
	angularDamping?: number;

	/**
	 * The initial linear velocity of this body.
	 * @defaultValue [0,0,0]
	 */
	linearVelocity: THREE.Vector3Tuple;

	/**
	 * The initial angular velocity of this body.
	 * @defaultValue [0,0,0]
	 */
	angularVelocity: THREE.Vector3Tuple;

	/**
	 * The scaling factor applied to the gravity affecting the rigid-body.
	 * @defaultValue 1.0
	 */
	gravityScale: number;

	/**
	 * The dominance group of this RigidBody. If a rigid body has a higher domiance group,
	 * on collision it will be immune to forces originating from the other bodies.
	 * https://rapier.rs/docs/user_guides/javascript/rigid_bodies#dominance
	 * Default: 0
	 */
	dominanceGroup: number;

	/**
	 * Whether or not Continous Collision Detection is enabled for this rigid-body.
	 * https://rapier.rs/docs/user_guides/javascript/rigid_bodies#continuous-collision-detection
	 * @defaultValue false
	 */
	ccd: boolean;

	/**
	 * The maximum prediction distance Soft Continuous Collision-Detection.
	 *
	 * When set to 0, soft-CCD is disabled.
	 *
	 * Soft-CCD helps prevent tunneling especially of slow-but-thin to moderately fast objects.
	 * The soft CCD prediction distance indicates how far in the object’s path the CCD algorithm is allowed to inspect.
	 * Large values can impact performance badly by increasing the work needed from the broad-phase.
	 *
	 * It is a generally cheaper variant of regular CCD since it relies on predictive constraints instead of shape-cast and substeps.
	 *
	 * @defaultValue 0
	 */
	softCcdPrediction: number;

	/**
	 * Initial position of the RigidBody
	 */
	position?: NgtThreeElements['ngt-object3D']['position'];

	/**
	 * Initial rotation of the RigidBody
	 */
	rotation?: NgtThreeElements['ngt-object3D']['rotation'];

	/**
	 * Automatically generate colliders based on meshes inside this
	 * rigid body.
	 *
	 * You can change the default setting globally by setting the colliders
	 * prop on the <Physics /> component.
	 *
	 * Setting this to false will disable automatic colliders.
	 */
	colliders?: NgtrRigidBodyAutoCollider | false;

	/**
	 * Set the friction of auto-generated colliders.
	 * This does not affect any non-automatic child collider-components.
	 */
	friction?: number;

	/**
	 * Set the restitution (bounciness) of auto-generated colliders.
	 * This does not affect any non-automatic child collider-components.
	 */
	restitution?: number;

	/**
	 * Sets the number of additional solver iterations that will be run for this
	 * rigid-body and everything that interacts with it directly or indirectly
	 * through contacts or joints.
	 *
	 * Compared to increasing the global `World.numSolverIteration`, setting this
	 * value lets you increase accuracy on only a subset of the scene, resulting in reduced
	 * performance loss.
	 */
	additionalSolverIterations?: number;

	/**
	 * The default collision groups bitmask for all colliders in this rigid body.
	 * Can be customized per-collider.
	 */
	collisionGroups?: InteractionGroups;

	/**
	 * The default solver groups bitmask for all colliders in this rigid body.
	 * Can be customized per-collider.
	 */
	solverGroups?: InteractionGroups;

	/**
	 * The default active collision types for all colliders in this rigid body.
	 * Can be customized per-collider.
	 *
	 * Use `ActiveCollisionTypes` to specify which collision types should be active for this collider.
	 *
	 * @see https://rapier.rs/javascript3d/classes/Collider.html#setActiveCollisionTypes
	 * @see https://rapier.rs/javascript3d/enums/ActiveCollisionTypes.html
	 */
	activeCollisionTypes?: ActiveCollisionTypes;

	/**
	 * Locks all rotations that would have resulted from forces on the created rigid-body.
	 */
	lockRotations?: boolean;

	/**
	 * Locks all translations that would have resulted from forces on the created rigid-body.
	 */
	lockTranslations?: boolean;

	/**
	 * Allow rotation of this rigid-body only along specific axes.
	 */
	enabledRotations?: [x: boolean, y: boolean, z: boolean];

	/**
	 * Allow translation of this rigid-body only along specific axes.
	 */
	enabledTranslations?: [x: boolean, y: boolean, z: boolean];

	/**
	 * Passed down to the object3d representing this collider.
	 */
	userData?: NgtThreeElements['ngt-object3D']['userData'];

	/**
	 * Include invisible objects on the collider creation estimation.
	 */
	includeInvisible?: boolean;

	/**
	 * Transform the RigidBodyState
	 * @internal Do not use. Used internally by the InstancedRigidBodies to alter the RigidBody State
	 */
	transformState?: (state: NgtrRigidBodyState) => NgtrRigidBodyState;
}

/**
 * Arguments for creating a cuboid (box) collider.
 * @param halfWidth - Half-extent along the X axis
 * @param halfHeight - Half-extent along the Y axis
 * @param halfDepth - Half-extent along the Z axis
 */
export type NgtrCuboidArgs = [halfWidth: number, halfHeight: number, halfDepth: number];

/**
 * Arguments for creating a ball (sphere) collider.
 * @param radius - The radius of the sphere
 */
export type NgtrBallArgs = [radius: number];

/**
 * Arguments for creating a capsule collider.
 * @param halfHeight - Half the height of the cylindrical part
 * @param radius - The radius of the capsule
 */
export type NgtrCapsuleArgs = [halfHeight: number, radius: number];

/**
 * Arguments for creating a convex hull collider.
 * @param vertices - Array of vertex positions (x, y, z, x, y, z, ...)
 */
export type NgtrConvexHullArgs = [vertices: ArrayLike<number>];

/**
 * Arguments for creating a heightfield collider.
 * @param width - Number of rows in the height grid
 * @param height - Number of columns in the height grid
 * @param heights - Array of height values
 * @param scale - Scale factor for the heightfield dimensions
 */
export type NgtrHeightfieldArgs = [
	width: number,
	height: number,
	heights: number[],
	scale: { x: number; y: number; z: number },
];

/**
 * Arguments for creating a triangle mesh collider.
 * @param vertices - Array of vertex positions
 * @param indices - Array of triangle indices
 */
export type NgtrTrimeshArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>];

/**
 * Arguments for creating a polyline collider.
 * @param vertices - Array of vertex positions
 * @param indices - Array of segment indices
 */
export type NgtrPolylineArgs = [vertices: Float32Array, indices: Uint32Array];

/**
 * Arguments for creating a round cuboid collider (cuboid with rounded corners).
 * @param halfWidth - Half-extent along the X axis
 * @param halfHeight - Half-extent along the Y axis
 * @param halfDepth - Half-extent along the Z axis
 * @param borderRadius - Radius of the rounded corners
 */
export type NgtrRoundCuboidArgs = [halfWidth: number, halfHeight: number, halfDepth: number, borderRadius: number];

/**
 * Arguments for creating a cylinder collider.
 * @param halfHeight - Half the height of the cylinder
 * @param radius - The radius of the cylinder
 */
export type NgtrCylinderArgs = [halfHeight: number, radius: number];

/**
 * Arguments for creating a round cylinder collider (cylinder with rounded edges).
 * @param halfHeight - Half the height of the cylinder
 * @param radius - The radius of the cylinder
 * @param borderRadius - Radius of the rounded edges
 */
export type NgtrRoundCylinderArgs = [halfHeight: number, radius: number, borderRadius: number];

/**
 * Arguments for creating a cone collider.
 * @param halfHeight - Half the height of the cone
 * @param radius - The base radius of the cone
 */
export type NgtrConeArgs = [halfHeight: number, radius: number];

/**
 * Arguments for creating a round cone collider (cone with rounded edges).
 * @param halfHeight - Half the height of the cone
 * @param radius - The base radius of the cone
 * @param borderRadius - Radius of the rounded edges
 */
export type NgtrRoundConeArgs = [halfHeight: number, radius: number, borderRadius: number];

/**
 * Arguments for creating a convex mesh collider.
 * @param vertices - Array of vertex positions
 * @param indices - Array of face indices
 */
export type NgtrConvexMeshArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>];

/**
 * Arguments for creating a round convex hull collider.
 * @param vertices - Array of vertex positions
 * @param indices - Array of face indices
 * @param borderRadius - Radius of the rounded edges
 */
export type NgtrRoundConvexHullArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>, borderRadius: number];

/**
 * Arguments for creating a round convex mesh collider.
 * @param vertices - Array of vertex positions
 * @param indices - Array of face indices
 * @param borderRadius - Radius of the rounded edges
 */
export type NgtrRoundConvexMeshArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>, borderRadius: number];

// ============================================================================
// Joint Parameter Types
// ============================================================================

/**
 * Parameters for creating a spherical (ball-and-socket) joint.
 * Allows rotation around all axes but prevents relative translation.
 *
 * @example
 * ```typescript
 * sphericalJoint(bodyA, bodyB, {
 *   data: { body1Anchor: [0, 1, 0], body2Anchor: [0, -1, 0] }
 * });
 * ```
 */
export interface NgtrSphericalJointParams {
	/** Anchor point on the first body in local coordinates */
	body1Anchor: NgtVector3;
	/** Anchor point on the second body in local coordinates */
	body2Anchor: NgtVector3;
}

/**
 * Parameters for creating a fixed joint.
 * Prevents all relative movement between two bodies.
 *
 * @example
 * ```typescript
 * fixedJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body1LocalFrame: [0, 0, 0, 1],
 *     body2Anchor: [0, 0, 0],
 *     body2LocalFrame: [0, 0, 0, 1]
 *   }
 * });
 * ```
 */
export interface NgtrFixedJointParams {
	/** Anchor point on the first body in local coordinates */
	body1Anchor: NgtVector3;
	/** Local frame orientation of the first body (quaternion) */
	body1LocalFrame: NgtQuaternion;
	/** Anchor point on the second body in local coordinates */
	body2Anchor: NgtVector3;
	/** Local frame orientation of the second body (quaternion) */
	body2LocalFrame: NgtQuaternion;
}

/**
 * Parameters for creating a prismatic (slider) joint.
 * Allows translation along one axis only.
 *
 * @example
 * ```typescript
 * prismaticJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [2, 0, 0],
 *     axis: [1, 0, 0],
 *     limits: [-1, 1]
 *   }
 * });
 * ```
 */
export interface NgtrPrismaticJointParams {
	/** Anchor point on the first body in local coordinates */
	body1Anchor: NgtVector3;
	/** Anchor point on the second body in local coordinates */
	body2Anchor: NgtVector3;
	/** The axis along which translation is allowed */
	axis: NgtVector3;
	/** Optional translation limits [min, max] */
	limits?: [min: number, max: number];
}

/**
 * Parameters for creating a revolute (hinge) joint.
 * Allows rotation around one axis only.
 *
 * @example
 * ```typescript
 * revoluteJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [0, 1, 0],
 *     axis: [0, 1, 0],
 *     limits: [-Math.PI / 2, Math.PI / 2]
 *   }
 * });
 * ```
 */
export interface NgtrRevoluteJointParams {
	/** Anchor point on the first body in local coordinates */
	body1Anchor: NgtVector3;
	/** Anchor point on the second body in local coordinates */
	body2Anchor: NgtVector3;
	/** The axis of rotation */
	axis: NgtVector3;
	/** Optional rotation limits in radians [min, max] */
	limits?: [min: number, max: number];
}

/**
 * Parameters for creating a rope joint.
 * Limits the maximum distance between two anchor points.
 *
 * @example
 * ```typescript
 * ropeJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [0, 0, 0],
 *     length: 5
 *   }
 * });
 * ```
 */
export interface NgtrRopeJointParams {
	/** Anchor point on the first body in local coordinates */
	body1Anchor: NgtVector3;
	/** Anchor point on the second body in local coordinates */
	body2Anchor: NgtVector3;
	/** Maximum distance between the anchor points */
	length: number;
}

/**
 * Parameters for creating a spring joint.
 * Applies a force proportional to the distance between two anchor points.
 *
 * @example
 * ```typescript
 * springJoint(bodyA, bodyB, {
 *   data: {
 *     body1Anchor: [0, 0, 0],
 *     body2Anchor: [0, 0, 0],
 *     restLength: 2,
 *     stiffness: 100,
 *     damping: 10
 *   }
 * });
 * ```
 */
export interface NgtrSpringJointParams {
	/** Anchor point on the first body in local coordinates */
	body1Anchor: NgtVector3;
	/** Anchor point on the second body in local coordinates */
	body2Anchor: NgtVector3;
	/** The rest length of the spring */
	restLength: number;
	/** The spring stiffness coefficient */
	stiffness: number;
	/** The damping coefficient */
	damping: number;
}
