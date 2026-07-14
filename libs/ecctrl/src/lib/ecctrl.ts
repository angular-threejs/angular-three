import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	inject,
	input,
	model,
	output,
	signal,
	viewChild,
} from '@angular/core';
import type { Collider, RigidBody, World } from '@dimforge/rapier3d-compat';
import type { NgtEuler, NgtQuaternion, NgtThreeElements, NgtVector3 } from 'angular-three';
import { beforeRender, injectStore } from 'angular-three';
import type {
	NgtrColliderOptions,
	NgtrCollisionEnterPayload,
	NgtrCollisionExitPayload,
	NgtrContactForcePayload,
	NgtrIntersectionEnterPayload,
	NgtrIntersectionExitPayload,
	NgtrRigidBodyOptions,
} from 'angular-three-rapier';
import { beforePhysicsStep, NgtrCapsuleCollider, NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { NgteEcctrlGravity } from './gravity';
import {
	bakeCurveLut,
	evaluateCurveLut,
	fromRapierVector,
	NgteEcctrlCurveLut,
	projectOnPlane,
	slerpUnitVector,
	toRapierVector,
} from './math';
import {
	DEFAULT_ECCTRL_OPTIONS,
	DEFAULT_ECCTRL_POSITION,
	NgteEcctrlColliderOptions,
	NgteEcctrlCurveData,
	NgteEcctrlGravityVector,
	NgteEcctrlGroundDetection,
	NgteEcctrlHandle,
	NgteEcctrlMovementInput,
	NgteEcctrlOptions,
	NgteEcctrlRigidBodyOptions,
	NgteEcctrlState,
	NgteEcctrlUserData,
} from './types';

interface GroundContact {
	collider: Collider;
	point: THREE.Vector3;
	normal: THREE.Vector3;
	distance: number;
	walkable: boolean;
	detection: NgteEcctrlGroundDetection;
}

type ResolvedEcctrlOptions = Required<Omit<NgteEcctrlOptions, 'customGravity' | 'gravityField'>> &
	Pick<NgteEcctrlOptions, 'customGravity' | 'gravityField'>;
type RapierModule = NonNullable<ReturnType<NgtrPhysics['rapier']>>;

const DEFAULT_RIGID_BODY_OPTIONS: NgtrRigidBodyOptions = {
	canSleep: true,
	linearVelocity: [0, 0, 0],
	angularVelocity: [0, 0, 0],
	gravityScale: 1,
	dominanceGroup: 0,
	ccd: false,
	softCcdPrediction: 0,
	contactSkin: 0,
	colliders: false,
};

const DEFAULT_COLLIDER_OPTIONS: NgtrColliderOptions = {
	contactSkin: 0,
	friction: -0.5,
};

const DEFAULT_ECCTRL_INPUT_OPTIONS: NgteEcctrlOptions = {
	...DEFAULT_ECCTRL_OPTIONS,
	// Upstream derives these from capsule dimensions when callers do not set them.
	rayOriginOffest: undefined,
	rayLength: undefined,
	rayRadius: undefined,
};

function resolveEcctrlOptions(options: NgteEcctrlOptions): ResolvedEcctrlOptions {
	const capsuleHalfHeight = options.capsuleHalfHeight ?? DEFAULT_ECCTRL_OPTIONS.capsuleHalfHeight;
	const capsuleRadius = options.capsuleRadius ?? DEFAULT_ECCTRL_OPTIONS.capsuleRadius;

	return {
		...DEFAULT_ECCTRL_OPTIONS,
		...options,
		capsuleHalfHeight,
		capsuleRadius,
		rayOriginOffest: options.rayOriginOffest ?? -capsuleHalfHeight,
		rayLength: options.rayLength ?? capsuleRadius + 1,
		rayRadius: options.rayRadius ?? capsuleRadius / 2,
	};
}

function copyGravity(value: NgteEcctrlGravityVector, target: THREE.Vector3) {
	if (Array.isArray(value)) {
		target.set(value[0], value[1], value[2]);
	} else {
		target.set(value.x, value.y, value.z);
	}
	return target;
}

function createInitialState(): NgteEcctrlState {
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
		inputDirection: new THREE.Vector3(),
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
		physicsReady: false,
		grounded: false,
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

/**
 * A dynamic floating-capsule character controller for Angular Three Rapier scenes.
 *
 * `NgteEcctrl` owns its Rapier rigid body and capsule collider, while its content
 * is projected into that body. It intentionally accepts source-agnostic movement
 * input: keyboard, gamepad, touch, AI, or network code can all call
 * `setMovement()` on the exposed handle.
 *
 * The component must be nested inside `NgtrPhysics`.
 */
@Component({
	selector: 'ngte-ecctrl',
	exportAs: 'ecctrl',
	template: `
		<ngt-object3D
			rigidBody
			#rigidBody="rigidBody"
			[position]="position()"
			[rotation]="rotation()"
			[quaternion]="quaternion()"
			[scale]="scale()"
			[userData]="userData()"
			[options]="bodyOptions()"
			(wake)="wake.emit()"
			(sleep)="sleep.emit()"
			(collisionEnter)="collisionEnter.emit($event)"
			(collisionExit)="collisionExit.emit($event)"
			(intersectionEnter)="intersectionEnter.emit($event)"
			(intersectionExit)="intersectionExit.emit($event)"
			(contactForce)="contactForce.emit($event)"
		>
			<ngt-object3D
				#capsuleCollider="capsuleCollider"
				[capsuleCollider]="capsuleArgs()"
				[options]="capsuleOptions()"
			/>
			@if (resolvedOptions().debug) {
				<ngt-axes-helper [scale]="0.75" />
			}
			<ng-content />
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody, NgtrCapsuleCollider],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteEcctrl {
	/** Ecctrl locomotion and support-query tuning. */
	options = input(DEFAULT_ECCTRL_INPUT_OPTIONS, {
		transform: mergeInputs(DEFAULT_ECCTRL_INPUT_OPTIONS),
	});
	/** Initial transform for the internally-owned dynamic body. */
	position = input<NgtVector3>(DEFAULT_ECCTRL_POSITION);
	rotation = input<NgtEuler>();
	quaternion = input<NgtQuaternion>();
	scale = input<NgtVector3>([1, 1, 1]);
	userData = input<NgtThreeElements['ngt-object3D']['userData']>();
	/** Additional options forwarded to the internally-owned dynamic Rapier body. */
	rigidBodyOptions = input<NgteEcctrlRigidBodyOptions>({});
	/** Additional options forwarded to the internally-owned capsule collider. */
	colliderOptions = input<NgteEcctrlColliderOptions>({});
	/**
	 * Mutable source-agnostic movement input. `setMovement()` merges into this
	 * model rather than replacing it, matching upstream Ecctrl semantics.
	 */
	movement = model<NgteEcctrlMovementInput>({});
	/** Re-emitted owned rigid-body wake event. */
	wake = output<void>();
	/** Re-emitted owned rigid-body sleep event. */
	sleep = output<void>();
	collisionEnter = output<NgtrCollisionEnterPayload>();
	collisionExit = output<NgtrCollisionExitPayload>();
	intersectionEnter = output<NgtrIntersectionEnterPayload>();
	intersectionExit = output<NgtrIntersectionExitPayload>();
	contactForce = output<NgtrContactForcePayload>();

	private readonly physics = inject(NgtrPhysics);
	private readonly store = injectStore();
	private readonly customGravity = inject(NgteEcctrlGravity);

	private readonly rigidBodyDirective = viewChild<NgtrRigidBody>('rigidBody');
	private readonly capsuleColliderDirective = viewChild<NgtrCapsuleCollider>('capsuleCollider');

	/** The owned Rapier rigid body once the parent physics world is ready. */
	body = computed(() => this.rigidBodyDirective()?.rigidBody() ?? null);
	/** The owned capsule collider once the parent physics world is ready. */
	collider = computed(() => this.capsuleColliderDirective()?.collider() ?? null);
	/** Observable, immutable-by-convention snapshot updated once per physics step. */
	state = signal<NgteEcctrlState>(createInitialState());

	protected readonly resolvedOptions = computed(() => resolveEcctrlOptions(this.options()));

	protected bodyOptions = computed<NgtrRigidBodyOptions>(() => ({
		...DEFAULT_RIGID_BODY_OPTIONS,
		...this.rigidBodyOptions(),
		// Character content must never generate implicit mesh colliders.
		colliders: false,
	}));

	protected capsuleOptions = computed<NgtrColliderOptions>(() => ({
		...DEFAULT_COLLIDER_OPTIONS,
		...this.colliderOptions(),
	}));

	protected capsuleArgs = computed<[number, number]>(() => {
		const options = this.resolvedOptions();
		return [options.capsuleHalfHeight, options.capsuleRadius];
	});

	private readonly manualLockForward = signal<boolean | null>(null);
	private readonly customForward = signal(new THREE.Vector3(0, 0, -1));
	private jumpElapsed = 0;
	private canJumpAgain = true;
	private runWasPressed = false;
	private running = false;
	private jumping = false;
	private onPlatform = false;
	private supportBody: RigidBody | null = null;
	private actualSlopeAngle = 0;
	private standFriction = 0;
	private slideFriction = 0;

	private readonly vPosition = new THREE.Vector3();
	private readonly vLinearVelocity = new THREE.Vector3();
	private readonly vAngularVelocity = new THREE.Vector3();
	private readonly vGravity = new THREE.Vector3();
	private readonly vGravityDirection = new THREE.Vector3();
	private readonly vGravityUp = new THREE.Vector3();
	private readonly vGravityTargetDirection = new THREE.Vector3();
	private readonly vGravitySlerpStart = new THREE.Vector3();
	private readonly vGravitySlerpRelative = new THREE.Vector3();
	private readonly vUp = new THREE.Vector3();
	private readonly vForward = new THREE.Vector3();
	private readonly vRight = new THREE.Vector3();
	private readonly vDesiredMovement = new THREE.Vector3();
	private readonly vSupportVelocity = new THREE.Vector3();
	private readonly vRelativeVelocity = new THREE.Vector3();
	private readonly vPlanarVelocity = new THREE.Vector3();
	private readonly vVerticalVelocity = new THREE.Vector3();
	private readonly vMovingDirection = new THREE.Vector3();
	private readonly vLastInputDirection = new THREE.Vector3();
	private readonly vWantedVelocity = new THREE.Vector3();
	private readonly vRejectVelocity = new THREE.Vector3();
	private readonly vBaseImpulse = new THREE.Vector3();
	private readonly vImpulse = new THREE.Vector3();
	private readonly vMoveImpulse = new THREE.Vector3();
	private readonly vFloatingImpulse = new THREE.Vector3();
	private readonly vFrictionImpulse = new THREE.Vector3();
	private readonly vTorque = new THREE.Vector3();
	private readonly vAngularVelocityOnPlane = new THREE.Vector3();
	private readonly vAngularVelocityOnUp = new THREE.Vector3();
	private readonly vGroundNormal = new THREE.Vector3();
	private readonly vBodyXAxis = new THREE.Vector3();
	private readonly vBodyYAxis = new THREE.Vector3();
	private readonly vBodyZAxis = new THREE.Vector3();
	private readonly vPlatformPosition = new THREE.Vector3();
	private readonly vPlatformCenterOfMass = new THREE.Vector3();
	private readonly vPlatformAngularVelocity = new THREE.Vector3();
	private readonly vPlatformAngularContribution = new THREE.Vector3();
	private readonly qRotation = new THREE.Quaternion();
	private readonly qPlatformTurn = new THREE.Quaternion();
	private massRatioCurveData: NgteEcctrlCurveData | null = null;
	private massRatioCurveLut: NgteEcctrlCurveLut | null = null;

	/** Imperative adapter for code that should not depend on Angular signals. */
	readonly handle: NgteEcctrlHandle;

	constructor() {
		const component = this;
		this.handle = {
			get body() {
				return component.body();
			},
			get collider() {
				return component.collider();
			},
			get state() {
				return component.state();
			},
			get movement() {
				return component.movement();
			},
			get input() {
				return component.movement();
			},
			get upAxis() {
				return component.state().up;
			},
			get gravityDir() {
				return component.state().gravityDirection;
			},
			get gravityMag() {
				return component.state().gravityMagnitude;
			},
			get currPos() {
				return component.state().position;
			},
			get currQuat() {
				return component.state().rotation;
			},
			get currLinVel() {
				return component.state().linearVelocity;
			},
			get currAngVel() {
				return component.state().angularVelocity;
			},
			get inputDir() {
				return component.state().inputDirection;
			},
			get movingDirection() {
				return component.state().movingDirection;
			},
			get relativeVel() {
				return component.state().relativeVelocity;
			},
			get relativeVelOnPlane() {
				return component.state().relativePlanarVelocity;
			},
			get relativeVelOnUp() {
				return component.state().relativeVerticalVelocity;
			},
			get moveImpulse() {
				return component.state().moveImpulse;
			},
			get floatingImpulse() {
				return component.state().floatingImpulse;
			},
			get dragFrictionImpulse() {
				return component.state().dragFrictionImpulse;
			},
			get bodyXAxis() {
				return component.state().bodyXAxis;
			},
			get bodyYAxis() {
				return component.state().bodyYAxis;
			},
			get bodyZAxis() {
				return component.state().bodyZAxis;
			},
			get standCollider() {
				return component.state().standCollider;
			},
			get standPoint() {
				return component.state().groundPoint;
			},
			get standNormal() {
				return component.state().groundNormal;
			},
			get isOnGround() {
				return component.state().grounded;
			},
			get isFalling() {
				return component.state().falling;
			},
			get isOnPlatform() {
				return component.state().onPlatform;
			},
			get slopeAngle() {
				return component.state().slopeAngle;
			},
			get actualSlopeAngle() {
				return component.state().actualSlopeAngle;
			},
			get standFriction() {
				return component.state().standFriction;
			},
			get slideFriction() {
				return component.state().slideFriction;
			},
			get isMoving() {
				return component.state().moving;
			},
			get moveSpeed() {
				return component.state().moveSpeed;
			},
			get verticalSpeed() {
				return component.state().verticalSpeed;
			},
			get runActive() {
				return component.state().running;
			},
			get jumpActive() {
				return component.state().jumping;
			},
			get lockForward() {
				return component.state().lockForward;
			},
			get turnOnYQuat() {
				return component.state().turnOnUpQuaternion;
			},
			get turnOnUpQuaternion() {
				return component.state().turnOnUpQuaternion;
			},
			setMovement(input) {
				component.setMovement(input);
			},
			setLockForward(value) {
				component.setLockForward(value);
			},
			setForwardDir(value) {
				component.setForwardDir(value);
			},
		};

		beforePhysicsStep((world, delta) => this.step(world, delta));
		beforeRender(() => this.syncEnabledState());

		effect(() => {
			const body = this.body();
			if (!body) return;
			body.setEnabled(this.resolvedOptions().enable);
		});
	}

	/** Merges a partial input update into the persistent movement state. */
	setMovement(input: Partial<NgteEcctrlMovementInput>) {
		this.movement.update((current) => ({ ...current, ...input }));
	}

	/** Overrides the option-driven forward lock until changed again. */
	setLockForward(value: boolean) {
		this.manualLockForward.set(value);
	}

	/** Supplies the custom forward vector used when `useCustomForward` is enabled. */
	setForwardDir(value: THREE.Vector3) {
		this.customForward.set(value.clone());
	}

	private syncEnabledState() {
		const body = this.body();
		if (body) body.setEnabled(this.resolvedOptions().enable);
	}

	private step(world: World, currentDelta?: number) {
		const [body, collider, rapier] = [this.body(), this.collider(), this.physics.rapier()];
		if (!body || !collider || !rapier) return;

		const options = this.resolvedOptions();
		if (!options.enable) return;

		const stepDelta = currentDelta ?? world.timestep;
		if (!Number.isFinite(stepDelta) || stepDelta <= 0) return;
		const delta = stepDelta;
		const input = this.movement();
		const lockForward = this.manualLockForward() ?? options.lockForward;
		this.updateRunState(!!input.run, options);
		this.updateJumpState(!!input.jump, delta, options);

		let sleeping = body.isSleeping();
		if (sleeping && (this.onPlatform || this.hasControlInput(input, this.jumping))) {
			body.wakeUp();
			sleeping = false;
		}
		if (sleeping) return;

		fromRapierVector(body.translation(), this.vPosition);
		fromRapierVector(body.linvel(), this.vLinearVelocity);
		fromRapierVector(body.angvel(), this.vAngularVelocity);
		this.qRotation.set(body.rotation().x, body.rotation().y, body.rotation().z, body.rotation().w);
		this.updateBodyAxes();

		const gravityUp = this.resolveGravity(world, options, delta);
		if (options.useCharacterUpAxis) this.vUp.copy(this.vBodyYAxis);
		else this.vUp.copy(gravityUp);

		this.resolveMovementDirection(options, input);
		const hasMoveInput = this.vDesiredMovement.lengthSq() > 1e-6;
		const ground = this.detectGround(world, rapier, collider, options);
		this.actualSlopeAngle = ground ? ground.normal.angleTo(this.vUp) : 0;
		const grounded =
			!!ground?.walkable &&
			ground.distance < this.getFloatingDistance(ground, options) + options.rayHitForgiveness;
		const supportBody = grounded ? (ground?.collider.parent() ?? null) : null;
		this.updatePlatform(body, supportBody, grounded, delta, options);

		this.vRelativeVelocity.copy(this.vLinearVelocity).sub(this.vSupportVelocity);
		projectOnPlane(this.vRelativeVelocity, this.vUp, this.vPlanarVelocity);
		this.vVerticalVelocity.copy(this.vRelativeVelocity).projectOnVector(this.vUp);
		const falling = !grounded && this.vLinearVelocity.dot(this.vUp) < -0.1;
		this.standFriction = ground?.collider.friction() ?? 0;
		this.slideFriction = this.getSlideFriction(ground, options);
		const slopeAngle =
			grounded && ground ? -Math.asin(THREE.MathUtils.clamp(ground.normal.dot(this.vDesiredMovement), -1, 1)) : 0;

		if (options.autoBalance && this.vGravity.lengthSq() > 1e-8)
			this.applyBalance(body, this.vGravityUp, delta, options);
		if (ground && grounded) this.applyFloat(body, supportBody, ground, delta, options);
		else this.vFloatingImpulse.set(0, 0, 0);
		if (hasMoveInput) this.vFrictionImpulse.set(0, 0, 0);
		else this.applyFriction(body, ground, grounded, delta, options);
		this.applyGravity(body, grounded, falling, delta, options);
		if (this.jumping && ground && grounded) this.applyJump(body, supportBody, ground, options);
		this.applyMovementAndTurning(
			body,
			supportBody,
			ground,
			grounded,
			slopeAngle,
			hasMoveInput,
			lockForward,
			delta,
			options,
		);

		this.publishState(body, ground, grounded, slopeAngle, falling, lockForward);
	}

	private updateBodyAxes() {
		this.vBodyXAxis.set(1, 0, 0).applyQuaternion(this.qRotation).normalize();
		this.vBodyYAxis.set(0, 1, 0).applyQuaternion(this.qRotation).normalize();
		this.vBodyZAxis.set(0, 0, 1).applyQuaternion(this.qRotation).normalize();
	}

	private resolveGravity(world: World, options: ResolvedEcctrlOptions, delta: number) {
		if (!options.enableCustomGravity) {
			this.vGravity.set(world.gravity.x, world.gravity.y, world.gravity.z);
		} else if (options.gravityField) {
			copyGravity(options.gravityField(this.vPosition), this.vGravity);
		} else if (options.customGravity) {
			copyGravity(options.customGravity, this.vGravity);
		} else {
			this.customGravity.resolveGravity(this.vPosition, this.vGravity);
		}

		this.vGravityTargetDirection.copy(this.vGravity);
		if (this.vGravityTargetDirection.lengthSq() > 1e-8) this.vGravityTargetDirection.normalize();
		else this.vGravityTargetDirection.copy(this.vBodyYAxis).negate();

		slerpUnitVector(
			this.vGravityDirection,
			this.vGravityTargetDirection,
			1 - Math.exp(-options.gravityDirLerpSpeed * delta),
			this.vBodyXAxis,
			this.vGravityDirection,
			this.vGravitySlerpStart,
			this.vGravitySlerpRelative,
		);
		return this.vGravityUp.copy(this.vGravityDirection).negate();
	}

	private resolveMovementDirection(options: ResolvedEcctrlOptions, input: NgteEcctrlMovementInput) {
		if (options.useCustomForward) this.vForward.copy(this.customForward());
		else this.store.camera().getWorldDirection(this.vForward);

		projectOnPlane(this.vForward, this.vUp, this.vForward);
		if (this.vForward.lengthSq() < 1e-6) {
			projectOnPlane(this.vBodyZAxis, this.vUp, this.vForward);
		}
		if (this.vForward.lengthSq() < 1e-6) this.vForward.set(0, 0, -1);
		else this.vForward.normalize();

		this.vRight.crossVectors(this.vForward, this.vUp);
		if (this.vRight.lengthSq() < 1e-6) this.vRight.copy(this.vBodyXAxis);
		else this.vRight.normalize();

		const joystick = input.joystick;
		const hasJoystickInput = !!joystick && (joystick.x !== 0 || joystick.y !== 0);
		const horizontal = hasJoystickInput ? joystick.x : Number(input.rightward) - Number(input.leftward);
		const vertical = hasJoystickInput ? joystick.y : Number(input.forward) - Number(input.backward);

		this.vDesiredMovement.copy(this.vForward).multiplyScalar(vertical).addScaledVector(this.vRight, horizontal);
		if (this.vDesiredMovement.lengthSq() > 1e-6) this.vDesiredMovement.normalize();
	}

	private detectGround(
		world: World,
		rapier: RapierModule,
		self: Collider,
		options: ResolvedEcctrlOptions,
	): GroundContact | null {
		const castOrigin = this.vPosition
			.clone()
			.addScaledVector(this.vBodyYAxis, options.rayOriginOffest ?? -options.capsuleHalfHeight);
		const direction = this.vUp.clone().multiplyScalar(-1);
		const filter = (candidate: Collider) => this.shouldIncludeCollider(candidate, self);
		const maxAngleCos = Math.cos(options.slopeMaxAngle);

		const contactFromRay = (): GroundContact | null => {
			const hit = world.castRayAndGetNormal(
				new rapier.Ray(toRapierVector(castOrigin), toRapierVector(direction)),
				options.rayLength,
				false,
				rapier.QueryFilterFlags.EXCLUDE_SENSORS,
				undefined,
				self,
				undefined,
				filter,
			);
			if (!hit) return null;
			const normal = fromRapierVector(hit.normal, this.vGroundNormal.clone()).normalize();
			return {
				collider: hit.collider,
				point: castOrigin.clone().addScaledVector(direction, hit.timeOfImpact),
				normal,
				distance: hit.timeOfImpact,
				walkable: normal.dot(this.vUp) >= maxAngleCos,
				detection: 'rayCast',
			};
		};
		const findWalkableCenterRayHit = (): GroundContact | null => {
			let closest: GroundContact | null = null;
			world.intersectionsWithRay(
				new rapier.Ray(toRapierVector(castOrigin), toRapierVector(direction)),
				options.rayLength + options.rayRadius,
				false,
				(hit) => {
					const normal = fromRapierVector(hit.normal, this.vGroundNormal.clone()).normalize();
					const contact: GroundContact = {
						collider: hit.collider,
						point: castOrigin.clone().addScaledVector(direction, hit.timeOfImpact),
						normal,
						distance: hit.timeOfImpact,
						walkable: normal.dot(this.vUp) >= maxAngleCos,
						detection: 'rayCast',
					};
					if (contact.walkable && (!closest || contact.distance < closest.distance)) closest = contact;
					return true;
				},
				rapier.QueryFilterFlags.EXCLUDE_SENSORS,
				undefined,
				self,
				undefined,
				filter,
			);
			return closest;
		};

		if (options.groundDetection === 'rayCast') return contactFromRay();

		const hit = world.castShape(
			toRapierVector(castOrigin),
			this.qRotation,
			toRapierVector(direction),
			new rapier.Ball(options.rayRadius),
			0,
			options.rayLength,
			false,
			rapier.QueryFilterFlags.EXCLUDE_SENSORS,
			undefined,
			self,
			undefined,
			filter,
		);

		if (!hit) return null;
		const normal = fromRapierVector(hit.normal1, this.vGroundNormal.clone()).normalize();
		const contact: GroundContact = {
			collider: hit.collider,
			point: fromRapierVector(hit.witness1, new THREE.Vector3()),
			normal,
			distance: hit.time_of_impact,
			walkable: normal.dot(this.vUp) >= maxAngleCos,
			detection: 'shapeCast',
		};

		// A shape cast can touch the side of a steep edge. A center ray gives the
		// character a second chance to find walkable support behind that edge.
		if (contact.walkable) return contact;
		return findWalkableCenterRayHit();
	}

	private getFloatingDistance(ground: GroundContact, options: ResolvedEcctrlOptions) {
		return options.floatHeight + options.rayRadius * (ground.detection === 'shapeCast' ? 1 : 2);
	}

	private shouldIncludeCollider(candidate: Collider, self: Collider) {
		const selfBody = self.parent();
		if (
			candidate.handle === self.handle ||
			candidate.isSensor() ||
			(selfBody !== null && candidate.parent()?.handle === selfBody.handle)
		) {
			return false;
		}
		const userData = candidate.parent()?.userData as NgteEcctrlUserData | undefined;
		const ecctrl = userData?.ecctrl;
		return !ecctrl?.excludeRay && !ecctrl?.excludeCharacterRay;
	}

	private updatePlatform(
		body: RigidBody,
		supportBody: RigidBody | null,
		grounded: boolean,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		this.supportBody = supportBody;
		this.onPlatform = false;
		this.vSupportVelocity.set(0, 0, 0);
		this.qPlatformTurn.identity();

		if (
			!grounded ||
			!supportBody ||
			!options.followPlatform ||
			(!supportBody.isDynamic() && !supportBody.isKinematic())
		) {
			return;
		}

		this.onPlatform = true;
		const ratio = supportBody.isDynamic() ? this.massRatio(body, supportBody, options) : 1;
		fromRapierVector(supportBody.linvel(), this.vSupportVelocity);
		fromRapierVector(supportBody.angvel(), this.vPlatformAngularVelocity);
		fromRapierVector(supportBody.worldCom(), this.vPlatformCenterOfMass);
		this.vPlatformPosition.copy(this.vPosition).sub(this.vPlatformCenterOfMass);
		this.vPlatformAngularContribution
			.crossVectors(this.vPlatformAngularVelocity, this.vPlatformPosition)
			.multiplyScalar(ratio);
		this.vSupportVelocity.add(this.vPlatformAngularContribution);

		const angularSpeed = this.vPlatformAngularVelocity.length();
		if (angularSpeed > 1e-8) {
			this.qPlatformTurn.setFromAxisAngle(this.vPlatformAngularVelocity.normalize(), angularSpeed * delta);
		}
	}

	private applyBalance(body: RigidBody, gravityUp: THREE.Vector3, delta: number, options: ResolvedEcctrlOptions) {
		projectOnPlane(this.vAngularVelocity, this.vBodyYAxis, this.vAngularVelocityOnPlane);
		this.vTorque
			.crossVectors(this.vBodyYAxis, gravityUp)
			.multiplyScalar(options.autoBalanceSpringK)
			.addScaledVector(this.vAngularVelocityOnPlane, -options.autoBalanceDampingC)
			.multiplyScalar(60 * delta);
		body.applyTorqueImpulse(toRapierVector(this.vTorque), false);
	}

	private applyGravity(
		body: RigidBody,
		grounded: boolean,
		falling: boolean,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		const downSpeed = -this.vLinearVelocity.dot(this.vUp);
		const atTerminalVelocity = falling && downSpeed >= options.fallingMaxVel;
		const initialGravityScale = this.bodyOptions().gravityScale ?? 1;
		const gravityScale = grounded
			? 0
			: atTerminalVelocity
				? 0
				: falling
					? options.fallingGravityScale
					: initialGravityScale;

		if (!options.enableCustomGravity) {
			if (body.gravityScale() !== gravityScale) body.setGravityScale(gravityScale, false);
			return;
		}

		if (body.gravityScale() !== 0) body.setGravityScale(0, false);
		if (gravityScale === 0 || body.isSleeping()) return;

		if (!options.gravityField && !options.customGravity) {
			this.customGravity.applyGravityField(body, delta, this.vPosition, gravityScale, this.vImpulse);
			return;
		}

		this.vImpulse.copy(this.vGravity).multiplyScalar(body.mass() * gravityScale * delta);
		body.applyImpulse(toRapierVector(this.vImpulse), false);
	}

	private applyFloat(
		body: RigidBody,
		supportBody: RigidBody | null,
		ground: GroundContact,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		const heightError = this.getFloatingDistance(ground, options) - ground.distance;
		const normalVelocity = this.vRelativeVelocity.dot(this.vUp);
		const force = heightError * options.springK - normalVelocity * options.dampingC;
		this.vFloatingImpulse.copy(this.vUp).multiplyScalar(force * delta);

		// During jump startup, preserve support force but never pull the character
		// back toward a previous contact.
		if (this.jumping && this.vFloatingImpulse.dot(this.vUp) < 0) this.vFloatingImpulse.set(0, 0, 0);
		body.applyImpulse(toRapierVector(this.vFloatingImpulse), false);

		if (!supportBody?.isDynamic() || !options.applyCounterMass) return;

		const counterMagnitude = Math.max(
			-this.vFloatingImpulse.dot(this.vUp),
			body.mass() * this.vGravity.length() * delta,
		);
		if (counterMagnitude <= 0) return;

		this.vTorque.copy(this.vGravityUp).negate();
		if (this.vTorque.lengthSq() < 1e-8) this.vTorque.copy(this.vUp).multiplyScalar(-1);
		this.vTorque.normalize().multiplyScalar(counterMagnitude * this.massRatio(body, supportBody, options));
		supportBody.applyImpulseAtPoint(toRapierVector(this.vTorque), toRapierVector(ground.point), true);
	}

	private getSlideFriction(ground: GroundContact | null, options: ResolvedEcctrlOptions) {
		return THREE.MathUtils.clamp((this.standFriction + options.slideGripFactor) * 0.5, 0, 1);
	}

	private applyFriction(
		body: RigidBody,
		ground: GroundContact | null,
		grounded: boolean,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		if (!grounded || !ground) {
			this.vFrictionImpulse.set(0, 0, 0);
			return;
		}

		const multiplier =
			body.mass() *
			this.getSlideFriction(ground, options) *
			THREE.MathUtils.clamp(options.decDeltaTime, 0, 1) *
			60 *
			delta;
		this.vFrictionImpulse.copy(this.vPlanarVelocity).multiplyScalar(-multiplier);
		body.applyImpulse(toRapierVector(this.vFrictionImpulse), false);
	}

	private applyJump(
		body: RigidBody,
		supportBody: RigidBody | null,
		ground: GroundContact,
		options: ResolvedEcctrlOptions,
	) {
		this.vImpulse.copy(this.vUp).addScaledVector(ground.normal, options.slopeJumpFactor).normalize();

		// Ecctrl sets the take-off velocity directly, retaining planar motion and
		// inheriting the full velocity of a moving support.
		this.vBaseImpulse
			.copy(this.vPlanarVelocity)
			.add(this.vSupportVelocity)
			.addScaledVector(this.vImpulse, options.jumpVel);
		body.setLinvel(toRapierVector(this.vBaseImpulse), true);

		if (supportBody?.isDynamic() && options.applyCounterJumpImp) {
			this.vTorque
				.copy(this.vImpulse)
				.multiplyScalar(
					-body.mass() *
						options.jumpVel *
						this.massRatio(body, supportBody, options) *
						options.counterJumpImpFactor,
				);
			supportBody.applyImpulseAtPoint(toRapierVector(this.vTorque), toRapierVector(ground.point), true);
		}
	}

	private applyMovementAndTurning(
		body: RigidBody,
		supportBody: RigidBody | null,
		ground: GroundContact | null,
		grounded: boolean,
		slopeAngle: number,
		hasMoveInput: boolean,
		lockForward: boolean,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		const canTurn = this.vGravity.lengthSq() > 1e-8;
		if (lockForward) {
			if (canTurn) this.turnTowards(body, this.vForward, delta, options);
			if (hasMoveInput) this.applyMovement(body, supportBody, ground, grounded, slopeAngle, delta, options);
			else this.vMoveImpulse.set(0, 0, 0);
			this.vLastInputDirection.copy(this.vForward);
			return;
		}

		if (hasMoveInput) {
			if (canTurn) this.turnTowards(body, this.vDesiredMovement, delta, options);
			this.applyMovement(body, supportBody, ground, grounded, slopeAngle, delta, options);
			this.vLastInputDirection.copy(this.vDesiredMovement);
			return;
		}

		this.vMoveImpulse.set(0, 0, 0);
		if (this.vLastInputDirection.lengthSq() < 1e-6) this.vLastInputDirection.copy(this.vBodyZAxis);
		if (this.onPlatform && options.followPlatform) this.vLastInputDirection.applyQuaternion(this.qPlatformTurn);
		if (canTurn) this.turnTowards(body, this.vLastInputDirection, delta, options);
		this.vMovingDirection.copy(this.vLastInputDirection);
	}

	private applyMovement(
		body: RigidBody,
		supportBody: RigidBody | null,
		ground: GroundContact | null,
		grounded: boolean,
		slopeAngle: number,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		const speed = this.running ? options.maxRunVel : options.maxWalkVel;
		this.vMovingDirection.copy(this.vDesiredMovement);
		if (grounded && ground && Math.abs(slopeAngle) > 1e-6) {
			this.vTorque.crossVectors(this.vDesiredMovement, this.vUp);
			if (this.vTorque.lengthSq() > 1e-8)
				this.vMovingDirection.applyAxisAngle(this.vTorque.normalize(), slopeAngle);
		}

		this.vWantedVelocity
			.copy(this.vDesiredMovement)
			.multiplyScalar(this.vPlanarVelocity.dot(this.vDesiredMovement));
		this.vRejectVelocity.copy(this.vPlanarVelocity).sub(this.vWantedVelocity);
		if (!grounded) this.vRejectVelocity.set(0, 0, 0);

		this.vBaseImpulse.copy(this.vMovingDirection).multiplyScalar(speed).sub(this.vPlanarVelocity);
		const multiplier =
			body.mass() *
			THREE.MathUtils.clamp(options.accDeltaTime, 0, 1) *
			(grounded ? this.slideFriction : options.airDragFactor) *
			(this.actualSlopeAngle > options.slopeMaxAngle ? options.airDragFactor : 1);
		const frameCorrection = 60 * delta;

		this.vMoveImpulse
			.copy(this.vBaseImpulse)
			.addScaledVector(this.vRejectVelocity, -options.rejectVelFactor)
			.multiplyScalar(multiplier * frameCorrection);
		this.vImpulse.copy(this.vPosition).addScaledVector(this.vBodyYAxis, options.moveImpulsePointOffset);
		body.applyImpulseAtPoint(toRapierVector(this.vMoveImpulse), toRapierVector(this.vImpulse), true);

		if (grounded && supportBody?.isDynamic() && options.applyCounterMoveImp) {
			this.vTorque
				.copy(this.vBaseImpulse)
				.multiplyScalar(
					-multiplier *
						frameCorrection *
						this.massRatio(body, supportBody, options) *
						options.counterMoveImpFactor,
				);
			supportBody.applyImpulseAtPoint(toRapierVector(this.vTorque), toRapierVector(this.vImpulse), true);
		}
	}

	private turnTowards(
		body: RigidBody,
		targetDirection: THREE.Vector3,
		delta: number,
		options: ResolvedEcctrlOptions,
	) {
		if (targetDirection.lengthSq() < 1e-6) return;

		this.vTorque.crossVectors(this.vBodyZAxis, targetDirection);
		let dot = THREE.MathUtils.clamp(this.vBodyZAxis.dot(targetDirection), -1, 1);
		if (Math.abs(dot) < 1e-10) dot = 0;
		const angle = Math.atan2(this.vTorque.dot(this.vBodyYAxis), dot);
		this.vAngularVelocityOnUp.copy(this.vAngularVelocity).projectOnVector(this.vBodyYAxis);
		this.vTorque
			.copy(this.vBodyYAxis)
			.multiplyScalar(angle * options.autoBalanceSpringOnY)
			.addScaledVector(this.vAngularVelocityOnUp, -options.autoBalanceDampingOnY)
			.multiplyScalar(60 * delta);
		body.applyTorqueImpulse(toRapierVector(this.vTorque), false);
	}

	private updateJumpState(jumpPressed: boolean, delta: number, options: ResolvedEcctrlOptions) {
		if (this.jumping) {
			this.jumpElapsed += delta;
			if (this.jumpElapsed >= options.jumpDuration) this.jumping = false;
		} else {
			if (jumpPressed && this.canJumpAgain) {
				this.jumping = true;
				this.jumpElapsed = 0;
				this.canJumpAgain = false;
			}
			if (!jumpPressed) this.canJumpAgain = true;
		}
	}

	private updateRunState(runPressed: boolean, options: ResolvedEcctrlOptions) {
		if (options.enableToggleRun) {
			if (runPressed && !this.runWasPressed) this.running = !this.running;
		} else {
			this.running = runPressed;
		}
		this.runWasPressed = runPressed;
	}

	private massRatio(body: RigidBody, supportBody: RigidBody, options: ResolvedEcctrlOptions) {
		if (!supportBody.isDynamic()) return 1;

		const curveData = options.massRatioFallOffCurveData;
		if (this.massRatioCurveData !== curveData) {
			this.massRatioCurveData = curveData;
			this.massRatioCurveLut = bakeCurveLut(curveData);
		}

		const ratio = THREE.MathUtils.clamp(supportBody.mass() / Math.max(body.mass(), 1e-6), 0, 1);
		return evaluateCurveLut(this.massRatioCurveLut!, ratio);
	}

	private publishState(
		body: RigidBody,
		ground: GroundContact | null,
		grounded: boolean,
		slopeAngle: number,
		falling: boolean,
		lockForward: boolean,
	) {
		fromRapierVector(body.translation(), this.vPosition);
		fromRapierVector(body.linvel(), this.vLinearVelocity);
		fromRapierVector(body.angvel(), this.vAngularVelocity);
		const rotation = body.rotation();

		this.state.set({
			position: this.vPosition.clone(),
			rotation: new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
			linearVelocity: this.vLinearVelocity.clone(),
			angularVelocity: this.vAngularVelocity.clone(),
			gravity: this.vGravity.clone(),
			gravityMagnitude: this.vGravity.length(),
			gravityDirection: this.vGravityDirection.clone(),
			up: this.vUp.clone(),
			forward: this.vForward.clone(),
			right: this.vRight.clone(),
			desiredMovement: this.vDesiredMovement.clone(),
			inputDirection: this.vDesiredMovement.clone(),
			movingDirection: this.vMovingDirection.clone(),
			supportVelocity: this.vSupportVelocity.clone(),
			relativeVelocity: this.vRelativeVelocity.clone(),
			relativePlanarVelocity: this.vPlanarVelocity.clone(),
			relativeVerticalVelocity: this.vVerticalVelocity.clone(),
			moveImpulse: this.vMoveImpulse.clone(),
			floatingImpulse: this.vFloatingImpulse.clone(),
			dragFrictionImpulse: this.vFrictionImpulse.clone(),
			bodyXAxis: this.vBodyXAxis.clone(),
			bodyYAxis: this.vBodyYAxis.clone(),
			bodyZAxis: this.vBodyZAxis.clone(),
			groundPoint: ground?.point.clone() ?? null,
			groundNormal: ground?.normal.clone() ?? null,
			groundCollider: ground?.collider ?? null,
			standCollider: this.supportBody,
			physicsReady: true,
			grounded,
			onPlatform: this.onPlatform,
			slopeAngle,
			actualSlopeAngle: this.actualSlopeAngle,
			standFriction: this.standFriction,
			slideFriction: this.slideFriction,
			moving: this.vDesiredMovement.lengthSq() > 1e-6,
			moveSpeed: this.vPlanarVelocity.length(),
			verticalSpeed: this.vVerticalVelocity.dot(this.vUp),
			running: this.running,
			jumping: this.jumping,
			falling,
			lockForward,
			turnOnUpQuaternion: this.qPlatformTurn.clone(),
		});
	}

	private hasControlInput(input: NgteEcctrlMovementInput, jumpActive: boolean) {
		return !!(
			input.forward ||
			input.backward ||
			input.leftward ||
			input.rightward ||
			jumpActive ||
			Math.abs(input.joystick?.x ?? 0) > 1e-4 ||
			Math.abs(input.joystick?.y ?? 0) > 1e-4
		);
	}
}
