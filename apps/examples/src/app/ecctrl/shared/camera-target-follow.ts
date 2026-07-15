import type { NgtsCameraControls } from 'angular-three-soba/controls';
import * as THREE from 'three';

type CameraControls = ReturnType<NgtsCameraControls['controls']>;

export interface CameraTargetFollowRuntime {
	initialized: boolean;
	readonly previousAnchor: THREE.Vector3;
	readonly position: THREE.Vector3;
	readonly target: THREE.Vector3;
	readonly delta: THREE.Vector3;
}

export function createCameraTargetFollowRuntime(): CameraTargetFollowRuntime {
	return {
		initialized: false,
		previousAnchor: new THREE.Vector3(),
		position: new THREE.Vector3(),
		target: new THREE.Vector3(),
		delta: new THREE.Vector3(),
	};
}

/** Translates the camera and target together so orbit and zoom stay intact. */
export function followCameraControlsTarget(
	controls: CameraControls,
	anchor: THREE.Vector3,
	runtime: CameraTargetFollowRuntime,
) {
	controls.getPosition(runtime.position, false);
	controls.getTarget(runtime.target, false);

	if (!runtime.initialized) {
		runtime.delta.copy(anchor).sub(runtime.target);
		runtime.initialized = true;
	} else {
		runtime.delta.copy(anchor).sub(runtime.previousAnchor);
	}

	runtime.previousAnchor.copy(anchor);
	if (runtime.delta.lengthSq() <= 1e-18) return;

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
}
