import type { ElementRef } from '@angular/core';
import type * as THREE from 'three';
import type { NgtAnyRecord, NgtEquConfig, NgtInstanceNode, NgtRendererLike } from '../types';

/**
 * Collection of type checking and comparison utilities for Angular Three.
 *
 * These utilities help with runtime type checking of Three.js objects,
 * Angular references, and general equality comparisons.
 *
 * @example
 * ```typescript
 * // Check if something is a Three.js mesh
 * if (is.three<THREE.Mesh>(obj, 'isMesh')) {
 *   // obj is typed as THREE.Mesh
 * }
 *
 * // Check if two values are equal
 * if (is.equ(a, b, { objects: 'shallow' })) {
 *   // values are considered equal
 * }
 * ```
 */
export const is = {
	/** Checks if value is a plain object (not array or function) */
	obj: (a: unknown): a is object => a === Object(a) && !Array.isArray(a) && typeof a !== 'function',
	/** Checks if value is a Three.js Material */
	material: (a: unknown): a is THREE.Material => !!a && (a as THREE.Material).isMaterial,
	/** Checks if value is a Three.js BufferGeometry */
	geometry: (a: unknown): a is THREE.BufferGeometry => !!a && (a as THREE.BufferGeometry).isBufferGeometry,
	/** Checks if value is a Three.js OrthographicCamera */
	orthographicCamera: (a: unknown): a is THREE.OrthographicCamera =>
		!!a && (a as THREE.OrthographicCamera).isOrthographicCamera,
	/** Checks if value is a Three.js PerspectiveCamera */
	perspectiveCamera: (a: unknown): a is THREE.PerspectiveCamera =>
		!!a && (a as THREE.PerspectiveCamera).isPerspectiveCamera,
	/** Checks if value is a Three.js Camera */
	camera: (a: unknown): a is THREE.Camera => !!a && (a as THREE.Camera).isCamera,
	/** Checks if value is a renderer-like object with a render method */
	renderer: (a: unknown) => !!a && typeof a === 'object' && 'render' in a && typeof a['render'] === 'function',
	/** Checks if value is a Three.js Scene */
	scene: (a: unknown): a is THREE.Scene => !!a && (a as THREE.Scene).isScene,
	/** Checks if value is an Angular ElementRef */
	ref: (a: unknown): a is ElementRef => !!a && typeof a === 'object' && 'nativeElement' in a,
	/** Checks if value is an Angular Three instance node (prepared object) */
	instance: (a: unknown): a is NgtInstanceNode => !!a && !!(a as NgtAnyRecord)['__ngt__'],
	/** Checks if value is a Three.js Object3D */
	object3D: (a: unknown): a is THREE.Object3D => !!a && (a as THREE.Object3D).isObject3D,
	/**
	 * Generic Three.js type check using the is* pattern.
	 * @example is.three<THREE.Mesh>(obj, 'isMesh')
	 */
	three: <TThreeEntity extends object, TKey extends keyof TThreeEntity = keyof TThreeEntity>(
		a: unknown,
		isKey: TKey extends `is${infer K}` ? TKey : never,
	): a is TThreeEntity => !!a && (a as any)[isKey],
	/** Checks if value is a valid Three.js ColorRepresentation */
	colorRepresentation: (a: unknown): a is THREE.ColorRepresentation =>
		a != null && (typeof a === 'string' || typeof a === 'number' || is.three<THREE.Color>(a, 'isColor')),
	/** Checks if object has colorSpace or outputColorSpace property */
	colorSpaceExist: <
		T extends NgtRendererLike | THREE.Texture | object,
		P = T extends NgtRendererLike ? { outputColorSpace: string } : { colorSpace: string },
	>(
		object: T,
	): object is T & P => 'colorSpace' in object || 'outputColorSpace' in object,
	/**
	 * Deep equality comparison with configurable behavior for arrays and objects.
	 * @param a - First value to compare
	 * @param b - Second value to compare
	 * @param config - Comparison configuration
	 */
	equ(a: any, b: any, { arrays = 'shallow', objects = 'reference', strict = true }: NgtEquConfig = {}) {
		// Wrong type or one of the two undefined, doesn't match
		if (typeof a !== typeof b || !!a !== !!b) return false;
		// Atomic, just compare a against b
		if (typeof a === 'string' || typeof a === 'number') return a === b;
		const isObj = is.obj(a);
		if (isObj && objects === 'reference') return a === b;
		const isArr = Array.isArray(a);
		if (isArr && arrays === 'reference') return a === b;
		// Array or Object, shallow compare first to see if it's a match
		if ((isArr || isObj) && a === b) return true;
		// Last resort, go through keys
		let i;
		for (i in a) if (!(i in b)) return false;
		for (i in strict ? b : a) if (a[i] !== b[i]) return false;
		if (i === void 0) {
			if (isArr && a.length === 0 && b.length === 0) return true;
			if (isObj && Object.keys(a).length === 0 && Object.keys(b).length === 0) return true;
			if (a !== b) return false;
		}
		return true;
	},
};
