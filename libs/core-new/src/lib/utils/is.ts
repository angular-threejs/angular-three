import { ElementRef } from '@angular/core';
import {
	BufferGeometry,
	Camera,
	Material,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	Scene,
	Texture,
} from 'three';
import { NgtInstanceNode } from '../instance';
import { NgtRendererLike } from '../store';
import { NgtAnyRecord, NgtEquConfig } from '../types';

export const is = {
	obj: (object: unknown): object is object =>
		object === Object(object) && !Array.isArray(object) && typeof object !== 'function',
	orthographicCamera: (object: unknown): object is OrthographicCamera =>
		typeof object === 'object' && (object as OrthographicCamera).isOrthographicCamera,
	perspectiveCamera: (object: unknown): object is PerspectiveCamera =>
		typeof object === 'object' && (object as PerspectiveCamera).isPerspectiveCamera,
	camera: (object: unknown): object is Camera => typeof object === 'object' && (object as Camera).isCamera,
	object3D: (object: unknown): object is Object3D => !!object && (object as Object3D).isObject3D,
	material: (object: unknown): object is Material => !!object && (object as Material).isMaterial,
	geometry: (object: unknown): object is BufferGeometry => !!object && (object as BufferGeometry).isBufferGeometry,
	scene: (object: unknown): object is Scene => !!object && (object as Scene).isScene,
	renderer: (object: unknown) =>
		!!object && typeof object === 'object' && 'render' in object && typeof object['render'] === 'function',
	instance: (object: unknown): object is NgtInstanceNode => !!object && !!(object as NgtAnyRecord)['__ngt__'],
	ref: (object: unknown): object is ElementRef =>
		!!object && typeof object === 'object' && (object instanceof ElementRef || 'nativeElement' in object),
	colorSpaceExist: <
		T extends NgtRendererLike | Texture | object,
		P = T extends NgtRendererLike ? { outputColorSpace: string } : { colorSpace: string },
	>(
		object: T,
	): object is T & P => 'colorSpace' in object || 'outputColorSpace' in object,
	equ(a: any, b: any, { arrays = 'shallow', objects = 'reference', strict = true }: NgtEquConfig = {}) {
		// Wrong type or one of the two undefined, doesn't match
		if (typeof a !== typeof b || !!a !== !!b) return false;
		// Atomic, just compare a against b
		if (typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean') return a === b;
		const isObj = is.obj(a);
		if (isObj && objects === 'reference') return a === b;
		const isArr = Array.isArray(a);
		if (isArr && arrays === 'reference') return a === b;
		// Array or Object, shallow compare first to see if it's a match
		if ((isArr || isObj) && a === b) return true;
		// Last resort, go through keys
		let i;
		// Check if a has all the keys of b
		for (i in a) if (!(i in b)) return false;
		// Check if values between keys match
		if (isObj && arrays === 'shallow' && objects === 'shallow') {
			for (i in strict ? b : a)
				if (!is.equ(a[i as keyof typeof a], b[i], { strict, objects: 'reference' })) return false;
		} else {
			for (i in strict ? b : a) if (a[i] !== b[i]) return false;
		}
		// If i is undefined
		if (i === void 0) {
			// If both arrays are empty we consider them equal
			if (isArr && a.length === 0 && b.length === 0) return true;
			// If both objects are empty we consider them equal
			if (isObj && Object.keys(a).length === 0 && Object.keys(b).length === 0) return true;
			// Otherwise match them by value
			if (a !== b) return false;
		}
		return true;
	},
};
