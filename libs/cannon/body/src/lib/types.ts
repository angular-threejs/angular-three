import type {
	AtomicName,
	AtomicProps,
	BodyProps,
	BoxProps,
	CompoundBodyProps,
	ConvexPolyhedronProps,
	CylinderProps,
	HeightfieldProps,
	ParticleProps,
	PlaneProps,
	Quad,
	SphereProps,
	TrimeshProps,
	Triplet,
	VectorName,
} from '@pmndrs/cannon-worker-api';
import type * as THREE from 'three';

/**
 * API for getting and subscribing to atomic (single-value) physics body properties.
 * @template K - The atomic property name (e.g., 'mass', 'linearDamping')
 */
export interface NgtcAtomicApi<K extends AtomicName> {
	/**
	 * Set the property value.
	 * @param value - The new value to set
	 */
	set: (value: AtomicProps[K]) => void;
	/**
	 * Subscribe to property value changes.
	 * @param callback - Function called with the new value when it changes
	 * @returns Unsubscribe function
	 */
	subscribe: (callback: (value: AtomicProps[K]) => void) => () => void;
}

/**
 * API for manipulating and subscribing to a physics body's quaternion rotation.
 */
export interface NgtcQuaternionApi {
	/**
	 * Copy rotation from a Three.js Quaternion.
	 * @param quaternion - The quaternion to copy from
	 */
	copy: ({ w, x, y, z }: THREE.Quaternion) => void;
	/**
	 * Set quaternion components directly.
	 * @param x - X component
	 * @param y - Y component
	 * @param z - Z component
	 * @param w - W component
	 */
	set: (x: number, y: number, z: number, w: number) => void;
	/**
	 * Subscribe to quaternion changes.
	 * @param callback - Function called with [x, y, z, w] when rotation changes
	 * @returns Unsubscribe function
	 */
	subscribe: (callback: (value: Quad) => void) => () => void;
}

/**
 * API for manipulating and subscribing to 3D vector properties (position, velocity, etc.).
 */
export interface NgtcVectorApi {
	/**
	 * Copy values from a Three.js Vector3 or Euler.
	 * @param vector - The vector or euler to copy from
	 */
	copy: ({ x, y, z }: THREE.Vector3 | THREE.Euler) => void;
	/**
	 * Set vector components directly.
	 * @param x - X component
	 * @param y - Y component
	 * @param z - Z component
	 */
	set: (x: number, y: number, z: number) => void;
	/**
	 * Subscribe to vector changes.
	 * @param callback - Function called with [x, y, z] when value changes
	 * @returns Unsubscribe function
	 */
	subscribe: (callback: (value: Triplet) => void) => () => void;
}

/**
 * Complete API for controlling a single physics body instance.
 * Provides methods for applying forces, setting properties, and subscribing to changes.
 */
export type NgtcWorkerApi = {
	[K in AtomicName]: NgtcAtomicApi<K>;
} & {
	[K in VectorName]: NgtcVectorApi;
} & {
	/**
	 * Apply a force to the body at a world point.
	 * @param force - Force vector [x, y, z] in world space
	 * @param worldPoint - Point of application [x, y, z] in world space
	 */
	applyForce: (force: Triplet, worldPoint: Triplet) => void;
	/**
	 * Apply an impulse to the body at a world point.
	 * Unlike force, impulse is applied instantaneously.
	 * @param impulse - Impulse vector [x, y, z] in world space
	 * @param worldPoint - Point of application [x, y, z] in world space
	 */
	applyImpulse: (impulse: Triplet, worldPoint: Triplet) => void;
	/**
	 * Apply a force to the body at a local point.
	 * @param force - Force vector [x, y, z] in body's local space
	 * @param localPoint - Point of application [x, y, z] in body's local space
	 */
	applyLocalForce: (force: Triplet, localPoint: Triplet) => void;
	/**
	 * Apply an impulse to the body at a local point.
	 * @param impulse - Impulse vector [x, y, z] in body's local space
	 * @param localPoint - Point of application [x, y, z] in body's local space
	 */
	applyLocalImpulse: (impulse: Triplet, localPoint: Triplet) => void;
	/**
	 * Apply a torque to the body, causing it to rotate.
	 * @param torque - Torque vector [x, y, z]
	 */
	applyTorque: (torque: Triplet) => void;
	/** API for manipulating the body's quaternion rotation */
	quaternion: NgtcQuaternionApi;
	/** API for manipulating the body's Euler rotation */
	rotation: NgtcVectorApi;
	/**
	 * Override the visual scale of the body without affecting physics.
	 * @param scale - Scale vector [x, y, z]
	 */
	scaleOverride: (scale: Triplet) => void;
	/** Put the body to sleep (stops physics simulation until woken) */
	sleep: () => void;
	/** Wake up a sleeping body */
	wakeUp: () => void;
	/** Remove the body from the physics world */
	remove: () => void;
};

/**
 * Public API returned by body creation functions.
 * Extends NgtcWorkerApi with ability to access individual instances in InstancedMesh.
 */
export interface NgtcBodyPublicApi extends NgtcWorkerApi {
	/**
	 * Get the API for a specific instance in an InstancedMesh.
	 * @param index - The instance index
	 * @returns Worker API for the specified instance
	 */
	at: (index: number) => NgtcWorkerApi;
}

/**
 * Maps physics shape types to their corresponding property types.
 */
export interface NgtcBodyPropsMap {
	/** Infinite plane properties */
	Plane: PlaneProps;
	/** Box/cuboid properties with [width, height, depth] args */
	Box: BoxProps;
	/** Point mass with no collision shape */
	Particle: ParticleProps;
	/** Cylinder properties with [radiusTop, radiusBottom, height, segments] args */
	Cylinder: CylinderProps;
	/** Sphere properties with [radius] args */
	Sphere: SphereProps;
	/** Triangle mesh for complex static geometry */
	Trimesh: TrimeshProps;
	/** Height map terrain properties */
	Heightfield: HeightfieldProps;
	/** Convex hull from vertices and faces */
	ConvexPolyhedron: ConvexPolyhedronProps;
	/** Multiple shapes combined into one body */
	Compound: CompoundBodyProps;
}

/**
 * Function type for retrieving body properties by instance index.
 * Used with InstancedMesh to define properties for each instance.
 * @template T - The body props type
 */
export type NgtcGetByIndex<T extends BodyProps> = (index: number) => T;

/**
 * Function type for transforming body arguments before passing to physics engine.
 * @template T - The body props type
 */
export type NgtcArgFn<T extends BodyProps> = (args: NonNullable<T['args']>) => typeof args;
