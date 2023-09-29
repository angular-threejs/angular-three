import { effect, runInInjectionContext, type Injector } from '@angular/core';
import type { Quaternion as RapierQuaternion, Vector3 as RapierVector3 } from '@dimforge/rapier3d-compat';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import type { Vector3Tuple } from './types';

export const vectorArrayToVector3 = ([x, y, z]: Vector3Tuple) => new THREE.Vector3(x, y, z);
export const vector3ToQuaternion = (v: THREE.Vector3) => _quaternion.setFromEuler(_euler.setFromVector3(v));
export const rapierVector3ToVector3 = ({ x, y, z }: RapierVector3) => _vector3.set(x, y, z);
export const rapierQuaternionToQuaternion = ({ x, y, z, w }: RapierQuaternion) => _quaternion.set(x, y, z, w);

export function injectNgtrRaf(callback: (dt: number) => void, injector?: Injector) {
	injector = assertInjector(injectNgtrRaf, injector);
	return runInInjectionContext(injector, () => {
		let [raf, lastFrame] = [0, 0];

		effect((onCleanup) => {
			const loop = () => {
				const now = performance.now();
				const delta = now - lastFrame;

				raf = requestAnimationFrame(loop);
				callback(delta / 1000);
				lastFrame = now;
			};

			raf = requestAnimationFrame(loop);

			onCleanup(() => cancelAnimationFrame(raf));
		});
	});
}

export const _quaternion = new THREE.Quaternion();
export const _euler = new THREE.Euler();
export const _vector3 = new THREE.Vector3();
export const _object3d = new THREE.Object3D();
export const _matrix4 = new THREE.Matrix4();
export const _position = new THREE.Vector3();
export const _rotation = new THREE.Quaternion();
export const _scale = new THREE.Vector3();
