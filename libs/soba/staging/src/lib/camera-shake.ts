import { Directive, Signal, afterNextRender, input, untracked } from '@angular/core';
import { injectBeforeRender, injectStore } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Vector3 } from 'three';
import { SimplexNoise } from 'three-stdlib';

interface ControlsProto {
	update(): void;
	target: Vector3;
	addEventListener: (event: string, callback: (event: any) => void) => void;
	removeEventListener: (event: string, callback: (event: any) => void) => void;
}

export interface NgtsCameraShakeOptions {
	intensity: number;
	decay?: boolean;
	decayRate: number;
	maxYaw: number;
	maxPitch: number;
	maxRoll: number;
	yawFrequency: number;
	pitchFrequency: number;
	rollFrequency: number;
}

const defaultOptions: NgtsCameraShakeOptions = {
	intensity: 1,
	decayRate: 0.65,
	maxYaw: 0.1,
	maxPitch: 0.1,
	maxRoll: 0.1,
	yawFrequency: 0.1,
	pitchFrequency: 0.1,
	rollFrequency: 0.1,
};

@Directive({ selector: 'ngts-camera-shake', standalone: true })
export class NgtsCameraShake {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private camera = this.store.select('camera');
	private defaultControls = this.store.select('controls') as unknown as Signal<ControlsProto>;

	private initialRotation = untracked(this.camera).rotation.clone();
	private intensityOption = untracked(this.options).intensity;

	get intensity() {
		return this.intensityOption;
	}

	set intensity(val: number) {
		this.intensityOption = Math.min(1, Math.max(0, val));
	}

	private yawNoise = new SimplexNoise();
	private pitchNoise = new SimplexNoise();
	private rollNoise = new SimplexNoise();

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const defaultControls = this.defaultControls();
				if (!defaultControls) return;
				const camera = this.camera();

				const callback = () => void (this.initialRotation = camera.rotation.clone());
				defaultControls.addEventListener('change', callback);
				callback();
				return () => void defaultControls.removeEventListener('change', callback);
			});
		});

		injectBeforeRender(({ delta, clock }) => {
			const [{ maxYaw, yawFrequency, maxPitch, pitchFrequency, maxRoll, rollFrequency, decay, decayRate }, camera] = [
				this.options(),
				this.camera(),
			];
			const shake = Math.pow(this.intensity, 2);
			const yaw = maxYaw * shake * this.yawNoise.noise(clock.elapsedTime * yawFrequency, 1);
			const pitch = maxPitch * shake * this.pitchNoise.noise(clock.elapsedTime * pitchFrequency, 1);
			const roll = maxRoll * shake * this.rollNoise.noise(clock.elapsedTime * rollFrequency, 1);

			camera.rotation.set(this.initialRotation.x + pitch, this.initialRotation.y + yaw, this.initialRotation.z + roll);

			if (decay && this.intensity > 0) {
				this.intensity -= decayRate * delta;
			}
		});
	}
}
