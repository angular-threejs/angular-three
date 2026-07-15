import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { NgteEcctrlHandle, NgteEcctrlState } from 'angular-three-ecctrl';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { NgtTestBed } from 'angular-three/testing';
import * as THREE from 'three';
import { vi } from 'vitest';
import { advanceEcctrlCameraFollow, NgteEcctrlCameraFollow } from './camera-follow';

function createState(position = new THREE.Vector3()): NgteEcctrlState {
	return {
		position,
		rotation: new THREE.Quaternion(),
		linearVelocity: new THREE.Vector3(),
		angularVelocity: new THREE.Vector3(),
		gravity: new THREE.Vector3(0, -9.81, 0),
		gravityMagnitude: 9.81,
		gravityDirection: new THREE.Vector3(0, -1, 0),
		up: new THREE.Vector3(0, 1, 0),
		forward: new THREE.Vector3(0, 0, -1),
		right: new THREE.Vector3(1, 0, 0),
		desiredMovement: new THREE.Vector3(),
		movingDirection: new THREE.Vector3(),
		supportVelocity: new THREE.Vector3(),
		relativeVelocity: new THREE.Vector3(),
		relativePlanarVelocity: new THREE.Vector3(),
		relativeVerticalVelocity: new THREE.Vector3(),
		moveImpulse: new THREE.Vector3(),
		floatingImpulse: new THREE.Vector3(),
		dragFrictionImpulse: new THREE.Vector3(),
		bodyXAxis: new THREE.Vector3(1, 0, 0),
		bodyYAxis: new THREE.Vector3(0, 1, 0),
		bodyZAxis: new THREE.Vector3(0, 0, 1),
		groundPoint: null,
		groundNormal: null,
		groundCollider: null,
		standCollider: null,
		physicsReady: true,
		grounded: true,
		onPlatform: false,
		slopeAngle: 0,
		actualSlopeAngle: 0,
		standFriction: 0,
		slideFriction: 0,
		moving: false,
		moveSpeed: 0,
		verticalSpeed: 0,
		running: false,
		jumping: false,
		falling: false,
		lockForward: false,
		turnOnUpQuaternion: new THREE.Quaternion(),
	};
}

function createHarness() {
	const state = createState();
	const handle = {
		get state() {
			return state;
		},
	} as NgteEcctrlHandle;
	const position = new THREE.Vector3(4, 3, 8);
	const target = new THREE.Vector3(0, 1, 0);
	const controls = {
		camera: { up: new THREE.Vector3(0, 1, 0) },
		getPosition: vi.fn((out: THREE.Vector3) => out.copy(position)),
		getTarget: vi.fn((out: THREE.Vector3) => out.copy(target)),
		setLookAt: vi.fn((px, py, pz, tx, ty, tz) => {
			position.set(px, py, pz);
			target.set(tx, ty, tz);
			return Promise.resolve();
		}),
		update: vi.fn(),
		updateCameraUp: vi.fn(),
	};
	return { controls, handle, position, state, target };
}

@Component({
	template: `
		<ngts-camera-controls [options]="{ makeDefault: true }" [ecctrlCameraFollow]="{ ecctrl: handle }" />
	`,
	imports: [NgteEcctrlCameraFollow, NgtsCameraControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class CameraFollowHarness {
	readonly handle = { state: createState() } as NgteEcctrlHandle;
}

describe(advanceEcctrlCameraFollow.name, () => {
	it('anchors the initial pose, then translates camera and target together', () => {
		const harness = createHarness();
		const runtime = advanceEcctrlCameraFollow(harness.controls as never, { ecctrl: harness.handle });
		expect(harness.position).toEqual(new THREE.Vector3(4, 2, 8));
		expect(harness.target).toEqual(new THREE.Vector3(0, 0, 0));

		// Simulate a user orbit before the character moves.
		harness.position.set(6, 5, 9);
		harness.target.set(1, 2, 0);
		harness.state.position.set(2, 0, -3);
		advanceEcctrlCameraFollow(harness.controls as never, { ecctrl: harness.handle }, runtime);

		expect(harness.position).toEqual(new THREE.Vector3(8, 5, 6));
		expect(harness.target).toEqual(new THREE.Vector3(3, 2, -3));
		expect(harness.controls.update).toHaveBeenCalledTimes(2);
	});

	it('establishes a non-origin character anchor including its configured offset', () => {
		const harness = createHarness();
		harness.state.position.set(5, 2, -3);

		advanceEcctrlCameraFollow(harness.controls as never, {
			ecctrl: harness.handle,
			offset: [0, 1.5, 0.25],
		});

		expect(harness.target).toEqual(new THREE.Vector3(5, 3.5, -2.75));
		expect(harness.position).toEqual(new THREE.Vector3(9, 5.5, 5.25));
	});

	it('uses character-local offset and updates camera up for custom gravity', () => {
		const harness = createHarness();
		harness.state.position.set(1, 2, 3);
		harness.state.up.set(1, 0, 0);
		harness.state.bodyXAxis.set(0, 1, 0);
		harness.state.bodyYAxis.set(1, 0, 0);
		harness.state.bodyZAxis.set(0, 0, 1);
		// The camera-relative movement basis must not affect the follow offset.
		harness.state.right.set(0, 0, -1);
		harness.state.forward.set(0, -1, 0);

		const runtime = advanceEcctrlCameraFollow(harness.controls as never, {
			ecctrl: harness.handle,
			offset: [2, 3, 4],
			upMode: 'character',
		});
		harness.state.position.set(2, 2, 3);
		advanceEcctrlCameraFollow(
			harness.controls as never,
			{ ecctrl: harness.handle, offset: [2, 3, 4], upMode: 'character' },
			runtime,
		);

		expect(harness.controls.camera.up).toEqual(new THREE.Vector3(1, 0, 0));
		expect(harness.controls.updateCameraUp).toHaveBeenCalledTimes(1);
		expect(harness.position).toEqual(new THREE.Vector3(9, 6, 15));
	});

	it('re-anchors without a catch-up jump after being disabled', () => {
		const harness = createHarness();
		let runtime = advanceEcctrlCameraFollow(harness.controls as never, { ecctrl: harness.handle });
		harness.state.position.set(10, 0, 0);
		runtime = advanceEcctrlCameraFollow(
			harness.controls as never,
			{ ecctrl: harness.handle, enabled: false },
			runtime,
		);
		advanceEcctrlCameraFollow(harness.controls as never, { ecctrl: harness.handle }, runtime);
		expect(harness.target).toEqual(new THREE.Vector3(10, 0, 0));
		expect(harness.controls.setLookAt).toHaveBeenCalledTimes(2);
	});
});

describe(NgteEcctrlCameraFollow.name, () => {
	it('preserves automatic rendering by using the default frame priority', () => {
		const { store } = NgtTestBed.create(CameraFollowHarness);

		expect(store.snapshot.internal.priority).toBe(0);
	});
});
