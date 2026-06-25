import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { injectStore } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { MathUtils } from 'three';

@Component({
	selector: 'app-camera',
	template: `
		<ngts-orbit-controls
			[options]="{
				makeDefault: true,
				enableDamping: true,
				target: [0, 2, 0.2],
				autoRotate: true,
				autoRotateSpeed: 0.2,
				dampingFactor: 0.08,
				minDistance: 3,
				maxDistance: 40,
				minPolarAngle: MathUtils.degToRad(10),
				maxPolarAngle: MathUtils.degToRad(85),
			}"
		/>
	`,
	imports: [NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Camera {
	protected readonly MathUtils = MathUtils;
	private store = injectStore();

	constructor() {
		effect(() => {
			const camera = this.store.camera();
			camera.position.set(8, 5, 8);
			if ('fov' in camera) {
				camera.fov = 20;
				camera.updateProjectionMatrix();
			}
		});
	}
}
