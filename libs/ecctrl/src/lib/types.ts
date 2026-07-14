import type { Collider, RigidBody } from '@dimforge/rapier3d-compat';
import type { NgtVector3 } from 'angular-three';
import type { NgtrColliderOptions, NgtrRigidBodyOptions } from 'angular-three-rapier';
import type { Quaternion, Vector3 } from 'three';

/**
 * Mutable input consumed by an Ecctrl character on the next physics step.
 *
 * The controller deliberately stays input-source agnostic. Keyboard, gamepad,
 * touch, and AI adapters should all write this same shape through
 * `NgteEcctrl#setMovement`.
 */
export interface NgteEcctrlMovementInput {
	forward?: boolean;
	backward?: boolean;
	leftward?: boolean;
	rightward?: boolean;
	joystick?: {
		x: number;
		y: number;
	};
	run?: boolean;
	jump?: boolean;
}

/** Selects the physics query used to find ground below the character. */
export type NgteEcctrlGroundDetection = 'shapeCast' | 'rayCast';

/** A Three.js vector or `[x, y, z]` tuple; scalar math inputs are intentionally excluded. */
export type NgteEcctrlGravityVector = Exclude<NgtVector3, number>;

/** Resolves gravity at the controller's current world position. */
export type NgteEcctrlGravityField = (position: Vector3) => NgteEcctrlGravityVector;

/** A point in Ecctrl's weighted cubic-Hermite mass-ratio falloff curve. */
export interface NgteEcctrlCurvePoint {
	x: number;
	y: number;
	/** Incoming tangent angle in radians. */
	r_in?: number;
	/** Outgoing tangent angle in radians. */
	r_out?: number;
	/** Incoming tangent blend: `0` is linear, `1` uses the angle-derived tangent. */
	w_in?: number;
	/** Outgoing tangent blend: `0` is linear, `1` uses the angle-derived tangent. */
	w_out?: number;
}

/** Upstream-compatible curve data used to scale impulses applied to dynamic supports. */
export interface NgteEcctrlCurveData {
	points: ReadonlyArray<NgteEcctrlCurvePoint>;
	/** Number of uniformly-spaced LUT samples; Ecctrl defaults to `50`. */
	samples?: number;
}

/**
 * Flags read from `rigidBody.userData.ecctrl` while querying support geometry.
 *
 * They mirror Ecctrl's public escape hatches for custom scene geometry.
 */
export interface NgteEcctrlUserData {
	ecctrl?: {
		excludeRay?: boolean;
		excludeCharacterRay?: boolean;
		excludeVehicleRay?: boolean;
	};
}

/**
 * Character-controller tuning options. Values intentionally mirror the
 * upstream Ecctrl defaults while exposing Angular-friendly vector inputs.
 */
export interface NgteEcctrlOptions {
	enable?: boolean;
	/** Shows the controller body's orientation axes. */
	debug?: boolean;
	capsuleHalfHeight?: number;
	capsuleRadius?: number;
	lockForward?: boolean;
	useCustomForward?: boolean;
	useCharacterUpAxis?: boolean;
	enableCustomGravity?: boolean;
	/**
	 * Optional constant gravity override used when `enableCustomGravity` is
	 * enabled. Prefer `gravityField` or `NgteEcctrlGravity` for fields that vary
	 * by position.
	 */
	customGravity?: NgteEcctrlGravityVector;
	/** Per-controller position-dependent gravity override. */
	gravityField?: NgteEcctrlGravityField;
	gravityDirLerpSpeed?: number;
	maxWalkVel?: number;
	maxRunVel?: number;
	accDeltaTime?: number;
	decDeltaTime?: number;
	rejectVelFactor?: number;
	moveImpulsePointOffset?: number;
	jumpVel?: number;
	jumpDuration?: number;
	slopeJumpFactor?: number;
	airDragFactor?: number;
	slideGripFactor?: number;
	fallingGravityScale?: number;
	fallingMaxVel?: number;
	enableToggleRun?: boolean;
	groundDetection?: NgteEcctrlGroundDetection;
	slopeMaxAngle?: number;
	floatHeight?: number;
	/** Upstream spelling retained for API compatibility. */
	rayOriginOffest?: number;
	rayHitForgiveness?: number;
	rayLength?: number;
	rayRadius?: number;
	springK?: number;
	dampingC?: number;
	autoBalance?: boolean;
	autoBalanceSpringK?: number;
	autoBalanceDampingC?: number;
	autoBalanceSpringOnY?: number;
	autoBalanceDampingOnY?: number;
	followPlatform?: boolean;
	massRatioFallOffCurveData?: NgteEcctrlCurveData;
	applyCounterMass?: boolean;
	applyCounterJumpImp?: boolean;
	counterJumpImpFactor?: number;
	applyCounterMoveImp?: boolean;
	counterMoveImpFactor?: number;
}

/** Options forwarded to Ecctrl's internally-owned dynamic Rapier body. */
export type NgteEcctrlRigidBodyOptions = Partial<NgtrRigidBodyOptions>;

/** Options forwarded to Ecctrl's internally-owned capsule collider. */
export type NgteEcctrlColliderOptions = Partial<NgtrColliderOptions>;

/** Immutable snapshot of the controller's current observable state. */
export interface NgteEcctrlState {
	position: Vector3;
	rotation: Quaternion;
	linearVelocity: Vector3;
	angularVelocity: Vector3;
	gravity: Vector3;
	gravityMagnitude: number;
	gravityDirection: Vector3;
	up: Vector3;
	forward: Vector3;
	right: Vector3;
	desiredMovement: Vector3;
	/** Alias for `desiredMovement`, aligned with Ecctrl's upstream handle. */
	inputDirection: Vector3;
	movingDirection: Vector3;
	supportVelocity: Vector3;
	relativeVelocity: Vector3;
	relativePlanarVelocity: Vector3;
	relativeVerticalVelocity: Vector3;
	moveImpulse: Vector3;
	floatingImpulse: Vector3;
	dragFrictionImpulse: Vector3;
	bodyXAxis: Vector3;
	bodyYAxis: Vector3;
	bodyZAxis: Vector3;
	groundPoint: Vector3 | null;
	groundNormal: Vector3 | null;
	groundCollider: Collider | null;
	standCollider: RigidBody | null;
	/** True after the controller has published at least one physics-step state. */
	physicsReady: boolean;
	grounded: boolean;
	onPlatform: boolean;
	slopeAngle: number;
	actualSlopeAngle: number;
	standFriction: number;
	slideFriction: number;
	moving: boolean;
	moveSpeed: number;
	verticalSpeed: number;
	running: boolean;
	jumping: boolean;
	falling: boolean;
	lockForward: boolean;
	turnOnUpQuaternion: Quaternion;
}

/** A live, imperative view of a mounted Ecctrl character. */
export interface NgteEcctrlHandle {
	readonly body: RigidBody | null;
	readonly collider: Collider | null;
	readonly state: NgteEcctrlState;
	readonly movement: Readonly<NgteEcctrlMovementInput>;
	/** Upstream-compatible alias for the current source-agnostic movement input. */
	readonly input: Readonly<NgteEcctrlMovementInput>;
	readonly upAxis: Vector3;
	readonly gravityDir: Vector3;
	readonly gravityMag: number;
	readonly currPos: Vector3;
	readonly currQuat: Quaternion;
	readonly currLinVel: Vector3;
	readonly currAngVel: Vector3;
	readonly inputDir: Vector3;
	readonly movingDirection: Vector3;
	readonly relativeVel: Vector3;
	readonly relativeVelOnPlane: Vector3;
	readonly relativeVelOnUp: Vector3;
	readonly moveImpulse: Vector3;
	readonly floatingImpulse: Vector3;
	readonly dragFrictionImpulse: Vector3;
	readonly bodyXAxis: Vector3;
	readonly bodyYAxis: Vector3;
	readonly bodyZAxis: Vector3;
	readonly standCollider: RigidBody | null;
	readonly standPoint: Vector3 | null;
	readonly standNormal: Vector3 | null;
	readonly isOnGround: boolean;
	readonly isFalling: boolean;
	readonly isOnPlatform: boolean;
	readonly slopeAngle: number;
	readonly actualSlopeAngle: number;
	readonly standFriction: number;
	readonly slideFriction: number;
	readonly isMoving: boolean;
	readonly moveSpeed: number;
	readonly verticalSpeed: number;
	readonly runActive: boolean;
	readonly jumpActive: boolean;
	readonly lockForward: boolean;
	/** Upstream-compatible platform-turn quaternion name. */
	readonly turnOnYQuat: Quaternion;
	/** Descriptive alias for `turnOnYQuat`. */
	readonly turnOnUpQuaternion: Quaternion;
	setMovement(input: Partial<NgteEcctrlMovementInput>): void;
	setLockForward(value: boolean): void;
	setForwardDir(value: Vector3): void;
}

/** The animation states supplied by Ecctrl's optional animation adapter. */
export type NgteEcctrlAnimationState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP_START' | 'JUMP_IDLE' | 'JUMP_FALL' | 'JUMP_LAND';

/** Context passed to animation-state resolvers and transition listeners. */
export interface NgteEcctrlAnimationStateContext {
	readonly ecctrl: NgteEcctrlHandle;
	readonly state: NgteEcctrlState;
	readonly delta: number;
	readonly previousState: NgteEcctrlAnimationState | null;
	readonly isOnGround: boolean;
	readonly wasOnGround: boolean;
	readonly isFalling: boolean;
	readonly isMoving: boolean;
	readonly runActive: boolean;
	readonly jumpActive: boolean;
}

/** Resolves an animation state from the character's live movement state. */
export type NgteEcctrlAnimationStateResolver = (context: NgteEcctrlAnimationStateContext) => NgteEcctrlAnimationState;

/** Configuration accepted by the optional animation state controller. */
export interface NgteEcctrlAnimationStateControllerOptions {
	enabled?: boolean;
	resolver?: NgteEcctrlAnimationStateResolver;
}

/** Ecctrl's upstream defaults, kept in one public constant for discoverability. */
export const DEFAULT_ECCTRL_OPTIONS: Required<Omit<NgteEcctrlOptions, 'customGravity' | 'gravityField'>> = {
	enable: true,
	debug: false,
	capsuleHalfHeight: 0.3,
	capsuleRadius: 0.3,
	lockForward: false,
	useCustomForward: false,
	useCharacterUpAxis: false,
	enableCustomGravity: false,
	gravityDirLerpSpeed: 6,
	maxWalkVel: 2,
	maxRunVel: 5,
	accDeltaTime: 0.2,
	decDeltaTime: 0.2,
	rejectVelFactor: 1,
	moveImpulsePointOffset: 0.5,
	jumpVel: 5,
	jumpDuration: 0.1,
	slopeJumpFactor: 0,
	airDragFactor: 0.1,
	slideGripFactor: 0.5,
	fallingGravityScale: 3,
	fallingMaxVel: 20,
	enableToggleRun: true,
	groundDetection: 'shapeCast',
	slopeMaxAngle: Math.PI / 2.5,
	floatHeight: 0.2,
	rayOriginOffest: -0.3,
	rayHitForgiveness: 0.28,
	rayLength: 1.3,
	rayRadius: 0.15,
	springK: 80,
	dampingC: 6,
	autoBalance: true,
	autoBalanceSpringK: 0.5,
	autoBalanceDampingC: 0.03,
	autoBalanceSpringOnY: 0.08,
	autoBalanceDampingOnY: 0.006,
	followPlatform: true,
	massRatioFallOffCurveData: {
		points: [
			{ x: 0, y: 0, r_out: 0 },
			{ x: 0.5, y: 0, r_in: 0, r_out: 0 },
			{ x: 1, y: 1, r_in: 0 },
		],
	},
	applyCounterMass: true,
	applyCounterJumpImp: true,
	counterJumpImpFactor: 1,
	applyCounterMoveImp: true,
	counterMoveImpFactor: 1,
};

export const DEFAULT_ECCTRL_POSITION: NgtVector3 = [0, 1, 0];
