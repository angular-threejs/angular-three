import type { ElementRef } from '@angular/core';
import type * as THREE from 'three';
import type { NgtAnyRecord, NgtEquConfig, NgtInstanceNode, NgtRendererLike } from '../types';

export const is = {
	obj: (a: unknown): a is object => a === Object(a) && !Array.isArray(a) && typeof a !== 'function',
	material: (a: unknown): a is THREE.Material => !!a && (a as THREE.Material).isMaterial,
	geometry: (a: unknown): a is THREE.BufferGeometry => !!a && (a as THREE.BufferGeometry).isBufferGeometry,
	orthographicCamera: (a: unknown): a is THREE.OrthographicCamera =>
		!!a && (a as THREE.OrthographicCamera).isOrthographicCamera,
	perspectiveCamera: (a: unknown): a is THREE.PerspectiveCamera =>
		!!a && (a as THREE.PerspectiveCamera).isPerspectiveCamera,
	camera: (a: unknown): a is THREE.Camera => !!a && (a as THREE.Camera).isCamera,
	renderer: (a: unknown) => !!a && typeof a === 'object' && 'render' in a && typeof a['render'] === 'function',
	scene: (a: unknown): a is THREE.Scene => !!a && (a as THREE.Scene).isScene,
	ref: (a: unknown): a is ElementRef => !!a && typeof a === 'object' && 'nativeElement' in a,
	instance: (a: unknown): a is NgtInstanceNode => !!a && !!(a as NgtAnyRecord)['__ngt__'],
	object3D: (a: unknown): a is THREE.Object3D => !!a && (a as THREE.Object3D).isObject3D,
	three: <TThreeEntity extends object, TKey extends keyof TThreeEntity = keyof TThreeEntity>(
		a: unknown,
		isKey: TKey extends `is${infer K}` ? TKey : never,
	): a is TThreeEntity => !!a && (a as any)[isKey],
	colorSpaceExist: <
		T extends NgtRendererLike | THREE.Texture | object,
		P = T extends NgtRendererLike ? { outputColorSpace: string } : { colorSpace: string },
	>(
		object: T,
	): object is T & P => 'colorSpace' in object || 'outputColorSpace' in object,
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
