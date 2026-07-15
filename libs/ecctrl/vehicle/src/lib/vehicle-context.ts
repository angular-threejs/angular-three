import { InjectionToken } from '@angular/core';
import type { ColliderShapeCastHit, RayColliderIntersection, RigidBody, World } from '@dimforge/rapier3d-compat';
import type { NgteEcctrlCurveLut } from 'angular-three-ecctrl/curves';
import type { Quaternion, Vector3 } from 'three';
import type { NgteReadonlyVehicleInput } from './types';

export interface NgteEcctrlVehicleRuntimeState {
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
	readonly input: NgteReadonlyVehicleInput;
}

export interface NgteWheelControlConfig {
	maxDriveTorque: number;
	maxWheelAngVel: number;
	driveRatio: number;
	reverseTorqueScale: number;
	reverseRPMScale: number;
	engineTorqueCurveLut: NgteEcctrlCurveLut;
	steerAngleCurveLut: NgteEcctrlCurveLut;
	steerRate: number;
	maxSteerAngle: number;
}

export interface NgteWheelControlDemand {
	drive: number;
	steer: number;
	brake: number;
}

/** Mutable runtime module registered by one shape-cast wheel. */
export interface NgteWheelInfo {
	readonly id: string;
	readonly driveWheel: boolean;
	readonly steerWheel: boolean;
	readonly brakeWheel: boolean;
	readonly driveTorqueWeight: number;
	readonly wheelRadius: number;
	readonly maxBrakeTorque: number;
	readonly driveInvert: boolean;
	readonly steerInvert: boolean;
	readonly wheelAngVel: number;
	readonly wheelLinVel: number;
	readonly steerAngle: number;
	readonly hasContact: boolean;
	readonly isOnPlatform: boolean;
	readonly contactBody: RigidBody | null;
	readonly suspensionImpulse: Vector3;
	readonly longitudinalImpulse: Vector3;
	readonly lateralImpulse: Vector3;
	readonly suspensionPoint: Vector3;
	readonly contactPoint: Vector3;
	readonly rayPos: Vector3;
	readonly rayDir: Vector3;
	readonly rayRot: Quaternion;
	readonly rayUpDir: Vector3;
	readonly rayFwdDir: Vector3;
	readonly rayLeftDir: Vector3;
	readonly floatImp: Vector3;
	readonly rayHit: ColliderShapeCastHit | RayColliderIntersection | null;
	readonly rayHitBody: RigidBody | null;
	readonly rayHitPos: Vector3;
	readonly rayHitNormal: Vector3;
	/** Upstream spelling retained. */
	readonly rayHitFriciton: number;
	readonly rayOriginVel: Vector3;
	readonly rayHitPointVel: Vector3;
	readonly lngSlipRatio: number;
	readonly latSlipRatio: number;
	readonly slipStrength: number;
	readonly lngAxis: Vector3;
	readonly latAxis: Vector3;
	readonly lngFricImp: Vector3;
	readonly latFricImp: Vector3;
	readonly effInertia: number;
	readonly supPos: Vector3;
	readonly driveTorque: number;
	readonly brakeTorque: number;
	configure(config: NgteWheelControlConfig): void;
	setDemand(demand: NgteWheelControlDemand): void;
	step(world: World, delta: number): void;
}

/** Mutable runtime module registered by one thrust propeller. */
export interface NgtePropellerInfo {
	readonly id: string;
	readonly maxThrust: number;
	readonly torqueRatio: number;
	readonly invertThrust: boolean;
	readonly invertTorque: boolean;
	readonly currentThrottle: number;
	readonly finalThrottle: number;
	readonly worldPosition: Vector3;
	readonly worldQuaternion: Quaternion;
	readonly thrustPos: Vector3;
	readonly thrustDir: Vector3;
	readonly thrustPot: Vector3;
	readonly torqueDir: Vector3;
	readonly torquePot: Vector3;
	readonly worldThrustPos: Vector3;
	readonly worldThrustDir: Vector3;
	readonly worldTorqueDir: Vector3;
	readonly thrustImpulse: Vector3;
	readonly torqueImpulse: Vector3;
	readonly lx: number;
	readonly ly: number;
	readonly lz: number;
	readonly ax: number;
	readonly ay: number;
	readonly az: number;
	prepare(delta: number): void;
	setThrottle(throttle: number): void;
	apply(delta: number): void;
}

export interface NgteEcctrlVehicleContext {
	readonly state: NgteEcctrlVehicleRuntimeState;
	registerWheel(wheel: NgteWheelInfo): void;
	unregisterWheel(id: string): void;
	registerPropeller(propeller: NgtePropellerInfo): void;
	unregisterPropeller(id: string): void;
}

export const NGTE_ECCTRL_VEHICLE_CONTEXT = new InjectionToken<NgteEcctrlVehicleContext>('NGTE_ECCTRL_VEHICLE_CONTEXT');
