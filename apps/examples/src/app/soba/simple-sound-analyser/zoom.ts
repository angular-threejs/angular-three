import { Directive, inject, input } from '@angular/core';
import { beforeRender } from 'angular-three';
import { PerspectiveCamera } from 'three';
import { Track } from './track';

@Directive({ selector: 'app-track[zoom]' })
export class Zoom {
	enabled = input(false, { alias: 'zoom' });

	track = inject(Track);

	constructor() {
		beforeRender(({ camera }) => {
			const enabled = this.enabled();
			if (!enabled) return;

			const audio = this.track.audio();
			if (!audio) return;

			// Set the cameras field of view according to the frequency average
			(camera as PerspectiveCamera).fov = 25 - audio.avg / 15;
			camera.updateProjectionMatrix();
		});
	}
}
