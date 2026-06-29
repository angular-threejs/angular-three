import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { injectStore } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { MathUtils } from 'three';
import { FlowShieldState } from './state';

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
	private state = inject(FlowShieldState);
	private store = injectStore();

	constructor() {
		effect(() => {
			const camera = this.store.camera();
			camera.position.fromArray(this.state.canvas.position());
			if ('fov' in camera) {
				camera.fov = this.state.canvas.fov();
				camera.near = this.state.canvas.near();
				camera.far = this.state.canvas.far();
				camera.updateProjectionMatrix();
			}
		});
	}
}
