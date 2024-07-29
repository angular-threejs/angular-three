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
import { NgtAnyRecord, NgtEquConfig, NgtInstanceNode, NgtRendererLike } from '../types';

export const is = {
	obj: (a: unknown): a is object => a === Object(a) && !Array.isArray(a) && typeof a !== 'function',
	material: (a: unknown): a is Material => !!a && (a as Material).isMaterial,
	geometry: (a: unknown): a is BufferGeometry => !!a && (a as BufferGeometry).isBufferGeometry,
	orthographicCamera: (a: unknown): a is OrthographicCamera => !!a && (a as OrthographicCamera).isOrthographicCamera,
	perspectiveCamera: (a: unknown): a is PerspectiveCamera => !!a && (a as PerspectiveCamera).isPerspectiveCamera,
	camera: (a: unknown): a is Camera => !!a && (a as Camera).isCamera,
	renderer: (a: unknown) => !!a && typeof a === 'object' && 'render' in a && typeof a['render'] === 'function',
	scene: (a: unknown): a is Scene => !!a && (a as Scene).isScene,
	ref: (a: unknown): a is ElementRef => a instanceof ElementRef,
	instance: (a: unknown): a is NgtInstanceNode => !!a && !!(a as NgtAnyRecord)['__ngt__'],
	object3D: (a: unknown): a is Object3D => !!a && (a as Object3D).isObject3D,
	// instance: (a: unknown): a is NgtInstanceNode => !!a && !!(a as NgtAnyRecord)['__ngt__'],
	// ref: (a: unknown): a is ElementRef => a instanceof ElementRef,
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
