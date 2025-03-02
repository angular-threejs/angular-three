import { Directive, effect, inject, InjectionToken, Provider } from '@angular/core';
import { injectStore } from 'angular-three';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const directionVector = new THREE.Vector3();
const RESET_ORBIT_CONTROLS_DISTANCE = new InjectionToken<number>('distance');
const RESET_ORBIT_CONTROLS_DIR = new InjectionToken<[number, number, number]>('dir');

export function provideResetOrbitControls(distance: number, dir?: [number, number, number]) {
	const providers: Provider = [{ provide: RESET_ORBIT_CONTROLS_DISTANCE, useValue: distance }];

	if (dir) {
		providers.push({ provide: RESET_ORBIT_CONTROLS_DIR, useValue: dir });
	}

	return providers;
}

function injectResetOrbitControls() {
	const distance = inject(RESET_ORBIT_CONTROLS_DISTANCE, { optional: true }) || 20;
	const dir = inject(RESET_ORBIT_CONTROLS_DIR, { optional: true }) || [0, 0, 1];
	return { distance, dir };
}

@Directive()
export class ResetOrbitControls {
	constructor() {
		const { distance, dir } = injectResetOrbitControls();
		const store = injectStore();

		effect(() => {
			const controls = store.controls() as OrbitControls;
			if (!controls) return;

			const camera = controls.object; // This is the camera that OrbitControls is controlling

			// Get the current look-at target
			const target = controls.target;
			target.set(0, 0, 0);

			// Calculate the direction vector from target to camera
			directionVector.fromArray(dir).normalize();

			// Set the new camera position
			camera.position.copy(target).add(directionVector.multiplyScalar(distance));

			// Update the controls
			controls.update();
		});
	}
}
