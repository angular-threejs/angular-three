import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal, viewChild } from '@angular/core';
import {
	NgteEcctrlAnimationStateController,
	resolveEcctrlAnimationState,
	type NgteEcctrlAnimationStateContext,
} from 'angular-three-ecctrl/animation';
import { NgtrPhysics } from 'angular-three-rapier';
import { NgtTestBed } from 'angular-three/testing';
import * as THREE from 'three';
import { NgteEcctrl } from './ecctrl';
import type { NgteEcctrlState } from './types';

function createState(overrides: Partial<NgteEcctrlState> = {}): NgteEcctrlState {
	return {
		position: new THREE.Vector3(),
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
		movingDirection: new THREE.Vector3(0, 0, 1),
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
		...overrides,
	};
}

function resolve(
	state: NgteEcctrlState,
	previousState: NgteEcctrlAnimationStateContext['previousState'] = null,
	wasOnGround = state.grounded,
) {
	return resolveEcctrlAnimationState({
		ecctrl: {} as never,
		state,
		delta: 1 / 60,
		previousState,
		isOnGround: state.grounded,
		wasOnGround,
		isFalling: state.falling,
		isMoving: state.moving || state.desiredMovement.lengthSq() > 1e-6,
		runActive: state.running,
		jumpActive: state.jumping,
	});
}

function createPhysicsStub() {
	return {
		worldSingleton: signal(null),
		colliders: signal(false),
		rigidBodyStates: new Map(),
		colliderStates: new Map(),
		rigidBodyEvents: new Map(),
		colliderEvents: new Map(),
		beforeStepCallbacks: new Set(),
		afterStepCallbacks: new Set(),
		filterContactPairCallbacks: new Set(),
		filterIntersectionPairCallbacks: new Set(),
		rapier: signal(null),
	};
}

@Component({
	template: `
		<ngte-ecctrl
			#animation="animationState"
			#player="ecctrl"
			[animationState]="enabled()"
			[resolver]="resolver"
			(animationStateChange)="record($event)"
		/>
	`,
	imports: [NgteEcctrl, NgteEcctrlAnimationStateController],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class AnimationHarness {
	enabled = signal(true);
	readonly transitions: string[] = [];
	readonly player = viewChild.required(NgteEcctrl);
	readonly animation = viewChild.required(NgteEcctrlAnimationStateController);
	readonly resolver = resolveEcctrlAnimationState;

	record(state: string) {
		this.transitions.push(state);
	}
}

describe(resolveEcctrlAnimationState.name, () => {
	it('resolves stationary grounded characters to IDLE', () => {
		expect(resolve(createState())).toBe('IDLE');
	});

	it('distinguishes walking and running movement', () => {
		const desiredMovement = new THREE.Vector3(0, 0, 1);
		expect(resolve(createState({ desiredMovement }))).toBe('WALK');
		expect(resolve(createState({ desiredMovement, running: true }))).toBe('RUN');
	});

	it('follows the airborne state sequence', () => {
		expect(resolve(createState({ jumping: true }))).toBe('JUMP_START');
		expect(resolve(createState({ grounded: false, jumping: true }))).toBe('JUMP_IDLE');
		expect(resolve(createState({ grounded: false }))).toBe('JUMP_IDLE');
		expect(resolve(createState({ grounded: false, falling: true }))).toBe('JUMP_FALL');
		expect(resolve(createState(), 'JUMP_FALL', false)).toBe('JUMP_LAND');
	});

	it('resumes locomotion immediately when landing with movement', () => {
		const walking = createState({ moving: true, desiredMovement: new THREE.Vector3(0, 0, 1) });
		const running = createState({ moving: true, desiredMovement: new THREE.Vector3(0, 0, 1), running: true });

		expect(resolve(walking, 'JUMP_FALL', false)).toBe('WALK');
		expect(resolve(running, 'JUMP_FALL', false)).toBe('RUN');
	});

	it('emits de-duplicated animation transitions from mounted controller state', async () => {
		const physics = createPhysicsStub();
		const { advance, fixture, sceneGraphComponentRef } = NgtTestBed.create(AnimationHarness, {
			providers: [{ provide: NgtrPhysics, useValue: physics }],
		});
		const harness = sceneGraphComponentRef.instance;
		await advance(1, 1 / 60);
		expect(harness.transitions).toEqual([]);
		harness.player().state.set(createState());

		await advance(1, 1 / 60);
		await advance(1, 1 / 60);
		expect(harness.transitions).toEqual([]);

		harness.player().state.set(createState({ desiredMovement: new THREE.Vector3(0, 0, 1), moving: true }));
		await advance(1, 1 / 60);
		expect(harness.animation().state()).toBe('WALK');
		expect(harness.transitions).toEqual(['WALK']);

		harness.enabled.set(false);
		fixture.detectChanges();
		harness.player().state.set(createState({ desiredMovement: new THREE.Vector3(), running: true }));
		await advance(1, 1 / 60);
		expect(harness.transitions).toEqual(['WALK']);
	});
});
