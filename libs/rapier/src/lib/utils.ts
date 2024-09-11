import { OutputEmitterRef } from '@angular/core';
import { Quaternion as RapierQuaternion, Vector3 as RapierVector3 } from '@dimforge/rapier3d-compat';
import { NgtEuler, NgtQuaternion, NgtVector3 } from 'angular-three';
import { BufferGeometry, Euler, Mesh, Object3D, Vector3 } from 'three';
import { mergeVertices } from 'three-stdlib';
import { _matrix4, _position, _quaternion, _rotation, _scale } from './shared';
import { NgtrColliderOptions, NgtrColliderShape, NgtrRigidBodyAutoCollider, NgtrRigidBodyOptions } from './types';

/**
 * Creates a proxy that will create a singleton instance of the given class
 * when a property is accessed, and not before.
 *
 * @returns A proxy and a reset function, so that the instance can created again
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
	proxy: SingletonClass;
	reset: () => void;
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

export function rapierQuaternionToQuaternion({ x, y, z, w }: RapierQuaternion) {
	return _quaternion.set(x, y, z, w);
}

export function vector3ToRapierVector(v: NgtVector3) {
	if (Array.isArray(v)) {
		return new RapierVector3(v[0], v[1], v[2]);
	}

	if (typeof v === 'number') {
		return new RapierVector3(v, v, v);
	}
	const vector = v as Vector3;
	return new RapierVector3(vector.x, vector.y, vector.z);
}

export function quaternionToRapierQuaternion(v: NgtQuaternion) {
	if (Array.isArray(v)) {
		return new RapierQuaternion(v[0], v[1], v[2], v[3]);
	}
	return new RapierQuaternion(v.x, v.y, v.z, v.w);
}

export function getEmitter<T>(emitterRef: OutputEmitterRef<T> | undefined) {
	if (!emitterRef || !emitterRef['listeners']) return undefined;
	return emitterRef.emit.bind(emitterRef);
}

export function hasListener(...emitterRefs: (OutputEmitterRef<unknown> | undefined)[]) {
	return emitterRefs.some((emitterRef) => emitterRef && emitterRef['listeners'] && emitterRef['listeners'].length > 0);
}

function isChildOfMeshCollider(child: Mesh) {
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
	geometry: BufferGeometry,
	colliders: NgtrRigidBodyAutoCollider,
): { args: unknown[]; offset: Vector3 } {
	switch (colliders) {
		case 'cuboid': {
			geometry.computeBoundingBox();
			const { boundingBox } = geometry;
			const size = boundingBox!.getSize(new Vector3());
			return {
				args: [size.x / 2, size.y / 2, size.z / 2],
				offset: boundingBox!.getCenter(new Vector3()),
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
				args: [clonedGeometry.attributes['position'].array as Float32Array, clonedGeometry.index?.array as Uint32Array],
				offset: new Vector3(),
			};
		}

		case 'hull': {
			const clonedGeometry = geometry.clone();
			return {
				args: [clonedGeometry.attributes['position'].array as Float32Array],
				offset: new Vector3(),
			};
		}
	}

	return { args: [], offset: new Vector3() };
}

export function createColliderOptions(object: Object3D, options: NgtrRigidBodyOptions, ignoreMeshColliders = true) {
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

	const colliderFromChild = (child: Object3D) => {
		if ((child as Mesh).isMesh) {
			if (ignoreMeshColliders && isChildOfMeshCollider(child as Mesh)) return;

			const worldScale = child.getWorldScale(_scale);
			const shape = autoColliderMap[options.colliders || 'cuboid'] as NgtrColliderShape;
			child.updateWorldMatrix(true, false);
			_matrix4.copy(child.matrixWorld).premultiply(invertedParentMatrixWorld).decompose(_position, _rotation, _scale);

			const rotationEuler = new Euler().setFromQuaternion(_rotation, 'XYZ');

			const { geometry } = child as Mesh;
			const { args, offset } = getColliderArgsFromGeometry(geometry, options.colliders || 'cuboid');
			const { mass, linearDamping, angularDamping, canSleep, ccd, gravityScale, softCcdPrediction, ...rest } = options;

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
