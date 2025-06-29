import { computed, Directive, effect, input } from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { CameraShake } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

interface ControlsProto {
	update(): void;
	target: THREE.Vector3;
	addEventListener: (event: string, callback: (event: any) => void) => void;
	removeEventListener: (event: string, callback: (event: any) => void) => void;
}

const defaultOptions: Partial<Omit<CameraShake, 'object' | 'initialRotation' | 'updateInitialRotation' | 'update'>> = {
	intensity: 1,
	decayRate: 0.65,
	maxYaw: 0.1,
	maxPitch: 0.1,
	maxRoll: 0.1,
	yawFrequency: 0.1,
	pitchFrequency: 0.1,
	rollFrequency: 0.1,
};

@Directive({
	selector: 'ngts-camera-shake',
	exportAs: 'cameraShake',
})
export class NgtsCameraShake {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private store = injectStore();

	cameraShaker = computed(() => new CameraShake(this.store.camera()));

	constructor() {
		effect((onCleanup) => {
			const defaultControls = this.store.controls() as unknown as ControlsProto;
			if (!defaultControls) return;

			const cameraShaker = this.cameraShaker();
			const callback = () => void cameraShaker.updateInitialRotation();

			defaultControls.addEventListener('change', callback);
			callback();

			onCleanup(() => void defaultControls.removeEventListener('change', callback));
		});

		effect(() => {
			Object.assign(this.cameraShaker(), this.options());
		});

		beforeRender(({ delta, clock }) => {
			const cameraShaker = this.cameraShaker();
			cameraShaker.update(delta, clock.elapsedTime);
		});
	}
}
