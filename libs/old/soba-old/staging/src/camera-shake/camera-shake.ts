import { Directive, Input, computed, effect, type Signal } from '@angular/core';
import { injectBeforeRender, injectNgtStore, signalStore } from 'angular-three-old';
import { SimplexNoise } from 'three-stdlib';

type ControlsProto = {
	update(): void;
	target: THREE.Vector3;
	addEventListener: (event: string, callback: (event: any) => void) => void;
	removeEventListener: (event: string, callback: (event: any) => void) => void;
};

export type NgtsCameraShakeState = {
	decay?: boolean;
	intensity: number;
	decayRate: number;
	maxYaw: number;
	maxPitch: number;
	maxRoll: number;
	yawFrequency: number;
	pitchFrequency: number;
	rollFrequency: number;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngts-camera-shake': NgtsCameraShakeState;
	}
}

@Directive({
	selector: 'ngts-camera-shake',
	standalone: true,
})
export class NgtsCameraShake {
	private inputs = signalStore<NgtsCameraShakeState>({
		intensity: 1,
		decayRate: 0.65,
		maxYaw: 0.1,
		maxPitch: 0.1,
		maxRoll: 0.1,
		yawFrequency: 0.1,
		pitchFrequency: 0.1,
		rollFrequency: 0.1,
	});

	@Input({ alias: 'intensity' }) set _intensity(intensity: number) {
		this.inputs.set({ intensity });
	}

	@Input({ alias: 'decay' }) set _decay(decay: boolean) {
		this.inputs.set({ decay });
	}

	@Input({ alias: 'decayRate' }) set _decayRate(decayRate: number) {
		this.inputs.set({ decayRate });
	}

	@Input({ alias: 'maxYaw' }) set _maxYaw(maxYaw: number) {
		this.inputs.set({ maxYaw });
	}

	@Input({ alias: 'maxPitch' }) set _maxPitch(maxPitch: number) {
		this.inputs.set({ maxPitch });
	}

	@Input({ alias: 'maxRoll' }) set _maxRoll(maxRoll: number) {
		this.inputs.set({ maxRoll });
	}

	@Input({ alias: 'yawFrequency' }) set _yawFrequency(yawFrequency: number) {
		this.inputs.set({ yawFrequency });
	}

	@Input({ alias: 'pitchFrequency' }) set _pitchFrequency(pitchFrequency: number) {
		this.inputs.set({ pitchFrequency });
	}

	@Input({ alias: 'rollFrequency' }) set _rollFrequency(rollFrequency: number) {
		this.inputs.set({ rollFrequency });
	}

	private store = injectNgtStore();
	private camera = this.store.select('camera');
	private controls = this.store.select('controls') as unknown as Signal<ControlsProto>;

	private initialRotation = this.store.get('camera').rotation.clone();
	private yawNoise = new SimplexNoise();
	private rollNoise = new SimplexNoise();
	private pitchNoise = new SimplexNoise();

	private intensity = this.inputs.select('intensity');
	private constrainedIntensity = computed(() => {
		const intensity = this.intensity();
		if (intensity < 0 || intensity > 1) {
			return intensity < 0 ? 0 : 1;
		}
		return intensity;
	});

	constructor() {
		this.beforeRender();
		this.setEvents();
	}

	private beforeRender() {
		injectBeforeRender(({ clock, delta }) => {
			const [
				{ maxYaw, yawFrequency, maxPitch, pitchFrequency, maxRoll, rollFrequency, decay, decayRate },
				intensity,
				camera,
			] = [this.inputs.get(), this.constrainedIntensity(), this.camera()];

			const shake = Math.pow(intensity, 2);
			const yaw = maxYaw * shake * this.yawNoise.noise(clock.elapsedTime * yawFrequency, 1);
			const pitch = maxPitch * shake * this.pitchNoise.noise(clock.elapsedTime * pitchFrequency, 1);
			const roll = maxRoll * shake * this.rollNoise.noise(clock.elapsedTime * rollFrequency, 1);

			camera.rotation.set(this.initialRotation.x + pitch, this.initialRotation.y + yaw, this.initialRotation.z + roll);

			if (decay && intensity > 0) {
				this.inputs.set((state) => ({ intensity: state.intensity - decayRate * delta }));
			}
		});
	}

	private setEvents() {
		effect((onCleanup) => {
			const [camera, controls] = [this.camera(), this.controls()];
			if (controls) {
				const callback = () => void (this.initialRotation = camera.rotation.clone());
				controls.addEventListener('change', callback);
				callback();
				onCleanup(() => void controls.removeEventListener('change', callback));
			}
		});
	}
}
