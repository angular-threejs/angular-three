import { Quaternion as RapierQuaternion, Vector3 as RapierVector3 } from '@dimforge/rapier3d-compat';
import { is, NgtEuler, NgtQuaternion, NgtVector3 } from 'angular-three';
import * as THREE from 'three';
import { mergeVertices } from 'three-stdlib';
import { _matrix4, _position, _quaternion, _rotation, _scale } from './shared';
import { NgtrColliderOptions, NgtrColliderShape, NgtrRigidBodyAutoCollider, NgtrRigidBodyOptions } from './types';

/**
 * Creates a proxy that will create a singleton instance of the given class
 * when a property is accessed, and not before. This is useful for lazy initialization
 * of expensive objects like physics worlds.
 *
 * @template SingletonClass - The type of the singleton instance
 * @template CreationFn - The type of the factory function
 * @param createInstance - A function that returns a new instance of the class
 * @returns An object containing the proxy, reset function, and set function
 *
 * @example
 * ```typescript
 * const { proxy, reset } = createSingletonProxy(() => new World(gravity));
 * // Access the world lazily
 * proxy.step();
 * // Reset when done
 * reset();
 * ```
 */
export const createSingletonProxy = <
	SingletonClass extends object,
	CreationFn extends () => SingletonClass = () => SingletonClass,
>(
	/**
	 * A function that returns a new instance of the class
	 */
	createInstance: CreationFn,
): {
	/** The lazy proxy to the singleton instance */
	proxy: SingletonClass;
	/** Resets the singleton, allowing a new instance to be created */
	reset: () => void;
	/** Sets the singleton to a specific instance */
	set: (newInstance: SingletonClass) => void;
} => {
	let instance: SingletonClass | undefined;

	const handler: ProxyHandler<SingletonClass> = {
		get(target, prop) {
			if (!instance) {
				instance = createInstance();
			}
			return Reflect.get(instance!, prop);
		},
		set(target, prop, value) {
			if (!instance) {
				instance = createInstance();
			}
			return Reflect.set(instance!, prop, value);
		},
	};

	const proxy = new Proxy({} as SingletonClass, handler) as SingletonClass;

	const reset = () => {
		instance = undefined;
	};

	const set = (newInstance: SingletonClass) => {
		instance = newInstance;
	};

	/**
	 * Return the proxy and a reset function
	 */
	return { proxy, reset, set };
};

/**
 * Converts a Rapier quaternion to a Three.js quaternion.
 *
 * @param quaternion - The Rapier quaternion to convert
 * @returns A Three.js Quaternion with the same values
 */
export function rapierQuaternionToQuaternion({ x, y, z, w }: RapierQuaternion) {
	return _quaternion.set(x, y, z, w);
}

/**
 * Converts an Angular Three vector representation to a Rapier Vector3.
 * Supports arrays, numbers (uniform scale), and objects with x, y, z properties.
 *
 * @param v - The vector to convert (can be [x, y, z], a number, or {x, y, z})
 * @returns A Rapier Vector3 instance
 *
 * @example
 * ```typescript
 * vector3ToRapierVector([1, 2, 3]); // RapierVector3(1, 2, 3)
 * vector3ToRapierVector(5); // RapierVector3(5, 5, 5)
 * vector3ToRapierVector({ x: 1, y: 2, z: 3 }); // RapierVector3(1, 2, 3)
 * ```
 */
export function vector3ToRapierVector(v: NgtVector3) {
	if (Array.isArray(v)) {
		return new RapierVector3(v[0], v[1], v[2]);
	}

	if (typeof v === 'number') {
		return new RapierVector3(v, v, v);
	}

	return new RapierVector3(v.x, v.y, v.z);
}

/**
 * Converts an Angular Three quaternion representation to a Rapier Quaternion.
 * Supports arrays and objects with x, y, z, w properties.
 *
 * @param v - The quaternion to convert (can be [x, y, z, w] or {x, y, z, w})
 * @returns A Rapier Quaternion instance
 *
 * @example
 * ```typescript
 * quaternionToRapierQuaternion([0, 0, 0, 1]); // Identity quaternion
 * quaternionToRapierQuaternion({ x: 0, y: 0, z: 0, w: 1 }); // Identity quaternion
 * ```
 */
export function quaternionToRapierQuaternion(v: NgtQuaternion) {
	if (Array.isArray(v)) {
		return new RapierQuaternion(v[0], v[1], v[2], v[3]);
	}

	return new RapierQuaternion(v.x, v.y, v.z, v.w);
}

function isChildOfMeshCollider(child: THREE.Mesh) {
	let flag = false;
	child.traverseAncestors((a) => {
		if (a.userData['ngtRapierType'] === 'MeshCollider') flag = true;
	});
	return flag;
}

const autoColliderMap = {
	cuboid: 'cuboid',
	ball: 'ball',
	hull: 'convexHull',
	trimesh: 'trimesh',
};

function getColliderArgsFromGeometry(
	geometry: THREE.BufferGeometry,
	colliders: NgtrRigidBodyAutoCollider,
): { args: unknown[]; offset: THREE.Vector3 } {
	switch (colliders) {
		case 'cuboid': {
			geometry.computeBoundingBox();
			const { boundingBox } = geometry;
			const size = boundingBox!.getSize(new THREE.Vector3());
			return {
				args: [size.x / 2, size.y / 2, size.z / 2],
				offset: boundingBox!.getCenter(new THREE.Vector3()),
			};
		}

		case 'ball': {
			geometry.computeBoundingSphere();
			const { boundingSphere } = geometry;

			const radius = boundingSphere!.radius;

			return {
				args: [radius],
				offset: boundingSphere!.center,
			};
		}

		case 'trimesh': {
			const clonedGeometry = geometry.index ? geometry.clone() : mergeVertices(geometry);

			return {
				args: [
					clonedGeometry.attributes['position'].array as Float32Array,
					clonedGeometry.index?.array as Uint32Array,
				],
				offset: new THREE.Vector3(),
			};
		}

		case 'hull': {
			const clonedGeometry = geometry.clone();
			return {
				args: [clonedGeometry.attributes['position'].array as Float32Array],
				offset: new THREE.Vector3(),
			};
		}
	}

	return { args: [], offset: new THREE.Vector3() };
}

/**
 * Creates collider options by traversing child meshes of an object and generating
 * appropriate collider configurations based on their geometries.
 *
 * @param object - The parent Object3D to traverse for meshes
 * @param options - The rigid body options containing collider type and other settings
 * @param ignoreMeshColliders - Whether to skip meshes that are children of mesh colliders
 * @returns Array of collider configurations with shape, args, position, rotation, and scale
 *
 * @example
 * ```typescript
 * const colliderOptions = createColliderOptions(rigidBodyObject, { colliders: 'cuboid' });
 * // Returns array of collider configs for each mesh child
 * ```
 */
export function createColliderOptions(
	object: THREE.Object3D,
	options: NgtrRigidBodyOptions,
	ignoreMeshColliders = true,
) {
	const childColliderOptions: {
		colliderOptions: NgtrColliderOptions;
		args: unknown[];
		shape: NgtrColliderShape;
		rotation: NgtEuler;
		position: NgtVector3;
		scale: NgtVector3;
	}[] = [];
	object.updateWorldMatrix(true, false);
	const invertedParentMatrixWorld = object.matrixWorld.clone().invert();

	const colliderFromChild = (child: THREE.Object3D) => {
		if (is.three<THREE.Mesh>(child, 'isMesh')) {
			if (ignoreMeshColliders && isChildOfMeshCollider(child)) return;

			const worldScale = child.getWorldScale(_scale);
			const shape = autoColliderMap[options.colliders || 'cuboid'] as NgtrColliderShape;
			child.updateWorldMatrix(true, false);
			_matrix4
				.copy(child.matrixWorld)
				.premultiply(invertedParentMatrixWorld)
				.decompose(_position, _rotation, _scale);

			const rotationEuler = new THREE.Euler().setFromQuaternion(_rotation, 'XYZ');

			const { args, offset } = getColliderArgsFromGeometry(child.geometry, options.colliders || 'cuboid');
			const { mass, linearDamping, angularDamping, canSleep, ccd, gravityScale, softCcdPrediction, ...rest } =
				options;

			childColliderOptions.push({
				colliderOptions: rest,
				args,
				shape,
				rotation: [rotationEuler.x, rotationEuler.y, rotationEuler.z],
				position: [
					_position.x + offset.x * worldScale.x,
					_position.y + offset.y * worldScale.y,
					_position.z + offset.z * worldScale.z,
				],
				scale: [worldScale.x, worldScale.y, worldScale.z],
			});
		}
	};

	if (options.includeInvisible) {
		object.traverse(colliderFromChild);
	} else {
		object.traverseVisible(colliderFromChild);
	}

	return childColliderOptions;
}
