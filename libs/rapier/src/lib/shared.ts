import * as THREE from 'three';

/**
 * Shared reusable Three.js objects for internal calculations.
 * These are used to avoid creating new objects on every frame,
 * which would cause garbage collection pressure.
 *
 * @internal
 */

/** Shared quaternion for internal calculations */
export const _quaternion = new THREE.Quaternion();
/** Shared euler angles for internal calculations */
export const _euler = new THREE.Euler();
/** Shared vector3 for internal calculations */
export const _vector3 = new THREE.Vector3();
/** Shared Object3D for internal calculations */
export const _object3d = new THREE.Object3D();
/** Shared matrix4 for internal calculations */
export const _matrix4 = new THREE.Matrix4();
/** Shared position vector for internal calculations */
export const _position = new THREE.Vector3();
/** Shared rotation quaternion for internal calculations */
export const _rotation = new THREE.Quaternion();
/** Shared scale vector for internal calculations */
export const _scale = new THREE.Vector3();
