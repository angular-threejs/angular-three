import { Directive, inject, input } from '@angular/core';
import { beforeRender, type NgtVector3 } from 'angular-three';
import { NgteEcctrl, type NgteEcctrlHandle, type NgteEcctrlState } from 'angular-three-ecctrl';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import * as THREE from 'three';

type CameraControls = ReturnType<NgtsCameraControls['controls']>;
type CameraOffset = Exclude<NgtVector3, number>;

export interface NgteEcctrlCameraFollowOptions {
	/** The mounted controller or its framework-neutral imperative handle. */
	ecctrl: NgteEcctrl | NgteEcctrlHandle;
	/** Pauses following without changing the current camera pose. */
	enabled?: boolean;
	/** Offset from the body position, interpreted in world or character-local axes according to `upMode`. */
	offset?: CameraOffset;
	/** Selects the offset basis and whether camera up tracks Ecctrl's custom-gravity up axis. */
	upMode?: 'world' | 'character';
}

interface CameraFollowRuntime {
	initialized: boolean;
	lastHandle: NgteEcctrlHandle | null;
	previousAnchor: THREE.Vector3;
	position: THREE.Vector3;
	target: THREE.Vector3;
	anchor: THREE.Vector3;
	offset: THREE.Vector3;
	delta: THREE.Vector3;
}

function createRuntime(): CameraFollowRuntime {
	return {
		initialized: false,
		lastHandle: null,
		previousAnchor: new THREE.Vector3(),
		position: new THREE.Vector3(),
		target: new THREE.Vector3(),
		anchor: new THREE.Vector3(),
		offset: new THREE.Vector3(),
		delta: new THREE.Vector3(),
	};
}

/** Adds Ecctrl follow behavior to the existing CameraControls component. */
@Directive({
	selector: 'ngts-camera-controls[ecctrlCameraFollow]',
})
export class NgteEcctrlCameraFollow {
	ecctrlCameraFollow = input.required<NgteEcctrlCameraFollowOptions>();

	private readonly cameraControls = inject(NgtsCameraControls, { host: true });
	private readonly runtime = createRuntime();

	constructor() {
		// Keep the default priority so Angular Three retains automatic rendering.
		// The physics frame stepper mounts before scene content, so this callback
		// still consumes the state published during the current frame.
		beforeRender(() => {
			advanceEcctrlCameraFollow(this.cameraControls.controls(), this.ecctrlCameraFollow(), this.runtime);
		});
	}
}

/** @internal Exported only for focused behavioral tests; omitted from the public barrel. */
export function advanceEcctrlCameraFollow(
	controls: CameraControls,
	options: NgteEcctrlCameraFollowOptions,
	runtime: CameraFollowRuntime = createRuntime(),
) {
	const handle = options.ecctrl instanceof NgteEcctrl ? options.ecctrl.handle : options.ecctrl;
	if (runtime.lastHandle !== handle) {
		runtime.initialized = false;
		runtime.lastHandle = handle;
	}
	if (options.enabled === false) {
		runtime.initialized = false;
		return runtime;
	}

	const state = handle.state;
	if (!state.physicsReady) return runtime;
	copyVector(options.offset ?? [0, 0, 0], runtime.offset);
	resolveAnchor(state, runtime.offset, options.upMode ?? 'world', runtime.anchor);
	updateCameraUp(controls, state, options.upMode ?? 'world');

	if (!runtime.initialized) {
		controls.getPosition(runtime.position, false);
		controls.getTarget(runtime.target, false);
		runtime.delta.copy(runtime.anchor).sub(runtime.target);
		runtime.position.add(runtime.delta);
		runtime.target.add(runtime.delta);
		void controls.setLookAt(
			runtime.position.x,
			runtime.position.y,
			runtime.position.z,
			runtime.target.x,
			runtime.target.y,
			runtime.target.z,
			false,
		);
		controls.update(0);
		runtime.previousAnchor.copy(runtime.anchor);
		runtime.initialized = true;
		return runtime;
	}

	runtime.delta.copy(runtime.anchor).sub(runtime.previousAnchor);
	if (Math.abs(runtime.delta.x) + Math.abs(runtime.delta.y) + Math.abs(runtime.delta.z) > 1e-9) {
		controls.getPosition(runtime.position, false).add(runtime.delta);
		controls.getTarget(runtime.target, false).add(runtime.delta);
		void controls.setLookAt(
			runtime.position.x,
			runtime.position.y,
			runtime.position.z,
			runtime.target.x,
			runtime.target.y,
			runtime.target.z,
			false,
		);
		controls.update(0);
	}
	runtime.previousAnchor.copy(runtime.anchor);
	return runtime;
}

function resolveAnchor(
	state: NgteEcctrlState,
	offset: THREE.Vector3,
	upMode: NonNullable<NgteEcctrlCameraFollowOptions['upMode']>,
	target: THREE.Vector3,
) {
	target.copy(state.position);
	if (upMode === 'character') {
		target
			.addScaledVector(state.bodyXAxis, offset.x)
			.addScaledVector(state.bodyYAxis, offset.y)
			.addScaledVector(state.bodyZAxis, offset.z);
	} else target.add(offset);
	return target;
}

function updateCameraUp(
	controls: CameraControls,
	state: NgteEcctrlState,
	upMode: NonNullable<NgteEcctrlCameraFollowOptions['upMode']>,
) {
	const nextUp = upMode === 'character' ? state.up : THREE.Object3D.DEFAULT_UP;
	if (nextUp.lengthSq() < 1e-12 || controls.camera.up.angleTo(nextUp) < 1e-6) return;
	controls.camera.up.copy(nextUp).normalize();
	controls.updateCameraUp();
}

function copyVector(value: CameraOffset, target: THREE.Vector3) {
	if (Array.isArray(value)) target.set(value[0], value[1], value[2]);
	else target.set(value.x, value.y, value.z);
	return target;
}
