import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, effect, input } from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtEuler, NgtVector3 } from 'angular-three';
import { injectGLTF } from 'angular-three-soba/loaders';
import { injectAnimations, NgtsAnimationClips } from 'angular-three-soba/misc';
import { GLTF } from 'three-stdlib';

import turtleGLB from './model_52a_-_kemps_ridley_sea_turtle_no_id-transformed.glb';

/*
Author: DigitalLife3D (https://sketchfab.com/DigitalLife3D)
License: CC-BY-NC-4.0 (http://creativecommons.org/licenses/by-nc/4.0/)
Source: https://sketchfab.com/3d-models/model-52a-kemps-ridley-sea-turtle-no-id-7aba937dfbce480fb3aca47be3a9740b
Title: Model 52A - Kemps Ridley Sea Turtle (no ID)
*/
@Component({
	selector: 'app-turtle',
	template: `
		@let parameters = { position: position(), rotation: rotation(), scale: scale() };
		<ngt-primitive *args="[gltf.scene()]" [parameters]="parameters" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Turtle {
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);
	scale = input(1);

	protected gltf = injectGLTF<GLTF & { animations: NgtsAnimationClips<'Swim Cycle'>[] }>(() => turtleGLB);

	private animations = injectAnimations(this.gltf, this.gltf.scene);

	constructor() {
		effect(() => {
			if (!this.animations.ready()) return;

			this.animations.mixer.timeScale = 0.5;
			this.animations.actions['Swim Cycle']?.play();
		});

		injectBeforeRender(({ clock }) => {
			const scene = this.gltf.scene();
			if (!scene) return;

			scene.rotation.z = Math.sin(clock.elapsedTime / 4) / 2;
		});
	}
}
