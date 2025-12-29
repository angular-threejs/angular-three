import type {
	ActiveCollisionTypes,
	CoefficientCombineRule,
	Collider,
	ColliderHandle,
	InteractionGroups,
	RigidBody,
	RigidBodyHandle,
	Rotation,
	TempContactManifold,
	Vector,
	World,
} from '@dimforge/rapier3d-compat';
import type { NgtQuaternion, NgtThreeElements, NgtVector3 } from 'angular-three';
import type * as THREE from 'three';

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

export interface NgtrRigidBodyState {
	meshType: 'instancedMesh' | 'mesh';
	rigidBody: RigidBody;
	object: THREE.Object3D;
	invertedWorldMatrix: THREE.Matrix4;
	setMatrix: (matrix: THREE.Matrix4) => void;
	getMatrix: (matrix: THREE.Matrix4) => THREE.Matrix4;
	/**
	 * Required for instanced rigid bodies.
	 */
	scale: THREE.Vector3;
	isSleeping: boolean;
}
export type NgtrRigidBodyStateMap = Map<RigidBody['handle'], NgtrRigidBodyState>;

export interface NgtrColliderState {
	collider: Collider;
	object: THREE.Object3D;

	/**
	 * The parent of which this collider needs to base its
	 * world position on, can be empty
	 */
	worldParent?: THREE.Object3D;
}
export type NgtrColliderStateMap = Map<Collider['handle'], NgtrColliderState>;

export interface NgtrCollisionTarget {
	rigidBody?: RigidBody;
	collider: Collider;
	rigidBodyObject?: THREE.Object3D;
	colliderObject?: THREE.Object3D;
}

export interface NgtrCollisionPayload {
	/** the object firing the event */
	target: NgtrCollisionTarget;
	/** the other object involved in the event */
	other: NgtrCollisionTarget;
}

export interface NgtrCollisionEnterPayload extends NgtrCollisionPayload {
	manifold: TempContactManifold;
	flipped: boolean;
}

export interface NgtrCollisionExitPayload extends NgtrCollisionPayload {}
export interface NgtrIntersectionEnterPayload extends NgtrCollisionPayload {}
export interface NgtrIntersectionExitPayload extends NgtrCollisionPayload {}
export interface NgtrContactForcePayload extends NgtrCollisionPayload {
	totalForce: Vector;
	totalForceMagnitude: number;
	maxForceDirection: Vector;
	maxForceMagnitude: number;
}

export type NgtrCollisionEnterHandler = (payload: NgtrCollisionEnterPayload) => void;
export type NgtrCollisionExitHandler = (payload: NgtrCollisionExitPayload) => void;
export type NgtrIntersectionEnterHandler = (payload: NgtrIntersectionEnterPayload) => void;
export type NgtrIntersectionExitHandler = (payload: NgtrIntersectionExitPayload) => void;
export type NgtrContactForceHandler = (payload: NgtrContactForcePayload) => void;

export interface NgtrEventMapValue {
	onSleep?(): void;
	onWake?(): void;
	onCollisionEnter?: NgtrCollisionEnterHandler;
	onCollisionExit?: NgtrCollisionExitHandler;
	onIntersectionEnter?: NgtrIntersectionEnterHandler;
	onIntersectionExit?: NgtrIntersectionExitHandler;
	onContactForce?: NgtrContactForceHandler;
}
export type NgtrEventMap = Map<ColliderHandle | RigidBodyHandle, NgtrEventMapValue>;

export type NgtrWorldStepCallback = (world: World) => void;
export type NgtrWorldStepCallbackSet = Set<NgtrWorldStepCallback>;

export interface NgtrCollisionSource {
	collider: {
		object: Collider;
		events?: NgtrEventMapValue;
		state?: NgtrColliderState;
	};
	rigidBody: {
		object?: RigidBody;
		events?: NgtrEventMapValue;
		state?: NgtrRigidBodyState;
	};
}

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

export type NgtrRigidBodyType = 'fixed' | 'dynamic' | 'kinematicPosition' | 'kinematicVelocity';

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

export type NgtrCuboidArgs = [halfWidth: number, halfHeight: number, halfDepth: number];
export type NgtrBallArgs = [radius: number];
export type NgtrCapsuleArgs = [halfHeight: number, radius: number];
export type NgtrConvexHullArgs = [vertices: ArrayLike<number>];
export type NgtrHeightfieldArgs = [
	width: number,
	height: number,
	heights: number[],
	scale: { x: number; y: number; z: number },
];
export type NgtrTrimeshArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>];
export type NgtrPolylineArgs = [vertices: Float32Array, indices: Uint32Array];
export type NgtrRoundCuboidArgs = [halfWidth: number, halfHeight: number, halfDepth: number, borderRadius: number];
export type NgtrCylinderArgs = [halfHeight: number, radius: number];
export type NgtrRoundCylinderArgs = [halfHeight: number, radius: number, borderRadius: number];
export type NgtrConeArgs = [halfHeight: number, radius: number];
export type NgtrRoundConeArgs = [halfHeight: number, radius: number, borderRadius: number];
export type NgtrConvexMeshArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>];
export type NgtrRoundConvexHullArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>, borderRadius: number];
export type NgtrRoundConvexMeshArgs = [vertices: ArrayLike<number>, indices: ArrayLike<number>, borderRadius: number];

// Joints
export interface NgtrSphericalJointParams {
	body1Anchor: NgtVector3;
	body2Anchor: NgtVector3;
}

export interface NgtrFixedJointParams {
	body1Anchor: NgtVector3;
	body1LocalFrame: NgtQuaternion;
	body2Anchor: NgtVector3;
	body2LocalFrame: NgtQuaternion;
}

export interface NgtrPrismaticJointParams {
	body1Anchor: NgtVector3;
	body2Anchor: NgtVector3;
	axis: NgtVector3;
	limits?: [min: number, max: number];
}

export interface NgtrRevoluteJointParams {
	body1Anchor: NgtVector3;
	body2Anchor: NgtVector3;
	axis: NgtVector3;
	limits?: [min: number, max: number];
}

export interface NgtrRopeJointParams {
	body1Anchor: NgtVector3;
	body2Anchor: NgtVector3;
	length: number;
}

export interface NgtrSpringJointParams {
	body1Anchor: NgtVector3;
	body2Anchor: NgtVector3;
	restLength: number;
	stiffness: number;
	damping: number;
}
