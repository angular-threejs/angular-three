import { computed, Directive, effect, input } from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { CameraShake } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

/**
 * Internal interface describing the camera controls protocol.
 * Used to detect and synchronize with orbit controls or similar camera control systems.
 *
 * @internal
 */
interface ControlsProto {
	/** Updates the controls state. */
	update(): void;
	/** The target point the camera is looking at. */
	target: THREE.Vector3;
	/** Adds an event listener for control events. */
	addEventListener: (event: string, callback: (event: any) => void) => void;
	/** Removes an event listener for control events. */
	removeEventListener: (event: string, callback: (event: any) => void) => void;
}

/**
 * Configuration options for the NgtsCameraShake directive.
 * Provides settings for controlling camera shake intensity and frequency.
 *
 * Available options include:
 * - `intensity`: Overall shake strength multiplier (default: 1)
 * - `decayRate`: How quickly the shake fades out (default: 0.65)
 * - `maxYaw`: Maximum rotation on the y-axis in radians (default: 0.1)
 * - `maxPitch`: Maximum rotation on the x-axis in radians (default: 0.1)
 * - `maxRoll`: Maximum rotation on the z-axis in radians (default: 0.1)
 * - `yawFrequency`: Frequency of yaw oscillation (default: 0.1)
 * - `pitchFrequency`: Frequency of pitch oscillation (default: 0.1)
 * - `rollFrequency`: Frequency of roll oscillation (default: 0.1)
 */
export type NgtsCameraShakeOptions = Partial<
	Omit<CameraShake, 'object' | 'initialRotation' | 'updateInitialRotation' | 'update'>
>;

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

/**
 * A directive that adds procedural camera shake effects using simplex noise.
 * Creates cinematic camera movements with configurable intensity, decay, and frequency
 * for yaw, pitch, and roll rotations.
 *
 * The shake is automatically synchronized with any attached camera controls,
 * updating the initial rotation when controls change.
 *
 * @example
 * ```html
 * <ngts-camera-shake
 *   [options]="{ intensity: 1, maxYaw: 0.1, maxPitch: 0.1, maxRoll: 0.1 }"
 *   #shake="cameraShake"
 * />
 * ```
 */
@Directive({
	selector: 'ngts-camera-shake',
	exportAs: 'cameraShake',
})
export class NgtsCameraShake {
	/** Configuration options for the camera shake effect. */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private store = injectStore();

	/**
	 * The underlying CameraShake instance that performs the actual shake calculations.
	 * Exposed for advanced usage such as manually triggering or stopping the shake.
	 */
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
