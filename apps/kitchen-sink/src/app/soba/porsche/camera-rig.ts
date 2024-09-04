import { Directive } from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { Vector3 } from 'three';

@Directive({ standalone: true })
export class CameraRig {
	constructor() {
		const v = new Vector3();

		injectBeforeRender(({ clock, camera }) => {
			const t = clock.elapsedTime;
			camera.position.lerp(v.set(Math.sin(t / 5), 0, 12 + Math.cos(t / 5) / 2), 0.05);
			camera.lookAt(0, 0, 0);
		});
	}
}
