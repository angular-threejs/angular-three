import type { RigidBody } from '@dimforge/rapier3d-compat';
import type { NgtVector3 } from 'angular-three';
import type { NgteEcctrlCurveData } from 'angular-three-ecctrl/curves';
import type { NgtrRigidBodyOptions } from 'angular-three-rapier';
import type { Quaternion, Vector3 } from 'three';
import type { NgtePropellerInfo, NgteWheelInfo } from './vehicle-context';

export interface NgteVehicleJoystick {
	x: number;
	y: number;
}

/** Source-agnostic input shared by Ecctrl cars and drones. */
export interface NgteVehicleInput {
	forward?: boolean;
	backward?: boolean;
	steerLeft?: boolean;
	steerRight?: boolean;
	brake?: boolean;
	throttleUp?: boolean;
	throttleDown?: boolean;
	yawLeft?: boolean;
	yawRight?: boolean;
	pitchForward?: boolean;
	pitchBackward?: boolean;
	rollLeft?: boolean;
	rollRight?: boolean;
	joystickL?: NgteVehicleJoystick;
	joystickR?: NgteVehicleJoystick;
}

export type NgteReadonlyVehicleInput = Readonly<{
	[Key in keyof NgteVehicleInput]: NgteVehicleInput[Key] extends NgteVehicleJoystick | undefined
		? Readonly<NgteVehicleJoystick> | undefined
		: NgteVehicleInput[Key];
}>;

export interface NgteCarConfig {
	/** Declared upstream for future position control; current car behavior is velocity-demand only. */
	controlMode?: 'VELOCITY' | 'POSITION';
	engineHorsepower?: number;
	engineMaxRPM?: number;
	gearRatios?: number[];
	finalDriveRatio?: number;
	transmissionMode?: 'auto' | 'manual';
	shiftUpRPM?: number;
	shiftDownRPM?: number;
	shiftCooldown?: number;
	steerRate?: number;
	maxSteerAngle?: number;
	reverseTorqueScale?: number;
	reverseRPMScale?: number;
	engineTorqueCurveData?: NgteEcctrlCurveData;
	steerAngleCurveData?: NgteEcctrlCurveData;
}

export interface NgteDroneConfig {
	controlMode?: 'VELOCITY' | 'POSITION';
	maxYawRate?: number;
	maxHorizSpeed?: number;
	maxVertSpeed?: number;
	maxTiltAngle?: number;
	airDragFactor?: number;
	TILT_P?: number;
	TILT_D?: number;
	YAW_POS_P?: number;
	YAW_VEL_P?: number;
	VERT_POS_P?: number;
	VERT_POS_D?: number;
	HORIZ_POS_P?: number;
	HORIZ_POS_D?: number;
	HORIZ_VEL_P?: number;
	VERT_VEL_P?: number;
}

export interface NgteEcctrlVehicleOptions {
	enable?: boolean;
	carConfig?: NgteCarConfig;
	droneConfig?: NgteDroneConfig;
	enableCustomGravity?: boolean;
	gravityDirLerpSpeed?: number;
}

export type NgteEcctrlVehicleRigidBodyOptions = Partial<NgtrRigidBodyOptions>;

export interface NgteEcctrlVehicleHandle {
	readonly body: RigidBody | null;
	readonly upAxis: Vector3;
	readonly gravityDir: Vector3;
	readonly gravityMag: number;
	readonly currPos: Vector3;
	readonly currQuat: Quaternion;
	readonly currLinVel: Vector3;
	readonly currAngVel: Vector3;
	readonly bodyXAxis: Vector3;
	readonly bodyYAxis: Vector3;
	readonly bodyZAxis: Vector3;
	readonly targetPos: Vector3;
	readonly targetFwd: Vector3;
	readonly input: NgteReadonlyVehicleInput;
	readonly wheelsInfo: ReadonlyMap<string, NgteWheelInfo>;
	readonly propellersInfo: ReadonlyMap<string, NgtePropellerInfo>;
	readonly gearIndex: number;
	readonly driveRatio: number;
	readonly engineRPM: number;
	setMovement(state: Partial<NgteVehicleInput>): void;
	setTarget(position?: Exclude<NgtVector3, number>, forward?: Exclude<NgtVector3, number>): void;
	setGear(index: number): void;
}

export const DEFAULT_ECCTRL_CAR_CONFIG: Required<NgteCarConfig> = {
	controlMode: 'VELOCITY',
	engineHorsepower: 6,
	engineMaxRPM: 6000,
	gearRatios: [10],
	finalDriveRatio: 1,
	transmissionMode: 'auto',
	shiftUpRPM: 5200,
	shiftDownRPM: 2200,
	shiftCooldown: 0.35,
	steerRate: Math.PI * 2,
	maxSteerAngle: Math.PI / 6,
	reverseTorqueScale: 1,
	reverseRPMScale: 0.3,
	engineTorqueCurveData: {
		points: [
			{ x: 0, y: 1, r_out: 0 },
			{ x: 1, y: 0, r_in: 0 },
		],
		samples: 50,
	},
	steerAngleCurveData: {
		points: [
			{ x: 0, y: 1, r_out: 0 },
			{ x: 0.2, y: 1, r_in: 0, r_out: 0 },
			{ x: 1, y: 0.4, r_in: 0 },
		],
		samples: 50,
	},
};

export const DEFAULT_ECCTRL_DRONE_CONFIG: Required<NgteDroneConfig> = {
	controlMode: 'VELOCITY',
	maxYawRate: 2,
	maxHorizSpeed: 30,
	maxVertSpeed: 8,
	maxTiltAngle: Math.PI / 4,
	airDragFactor: 0.2,
	TILT_P: 15,
	TILT_D: 3,
	YAW_POS_P: 6,
	YAW_VEL_P: 4,
	VERT_POS_P: 9,
	VERT_POS_D: 7,
	HORIZ_POS_P: 5,
	HORIZ_POS_D: 5.5,
	HORIZ_VEL_P: 1,
	VERT_VEL_P: 2,
};
