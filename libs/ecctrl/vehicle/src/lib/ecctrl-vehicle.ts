import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	forwardRef,
	inject,
	input,
	model,
	output,
	type Signal,
	viewChild,
} from '@angular/core';
import type { RigidBody, World } from '@dimforge/rapier3d-compat';
import type { NgtEuler, NgtQuaternion, NgtThreeElements, NgtVector3 } from 'angular-three';
import { bakeCurveLut, type NgteEcctrlCurveLut } from 'angular-three-ecctrl/curves';
import { NgteEcctrlGravity } from 'angular-three-ecctrl/gravity';
import type {
	NgtrCollisionEnterPayload,
	NgtrCollisionExitPayload,
	NgtrContactForcePayload,
	NgtrIntersectionEnterPayload,
	NgtrIntersectionExitPayload,
	NgtrRigidBodyOptions,
} from 'angular-three-rapier';
import { beforePhysicsStep, NgtrRigidBody } from 'angular-three-rapier';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import {
	DEFAULT_ECCTRL_CAR_CONFIG,
	DEFAULT_ECCTRL_DRONE_CONFIG,
	type NgteCarConfig,
	type NgteDroneConfig,
	type NgteEcctrlVehicleHandle,
	type NgteEcctrlVehicleOptions,
	type NgteReadonlyVehicleInput,
	type NgteVehicleInput,
} from './types';
import {
	NGTE_ECCTRL_VEHICLE_CONTEXT,
	type NgteEcctrlVehicleContext,
	type NgteEcctrlVehicleRuntimeState,
	type NgtePropellerInfo,
	type NgteWheelControlConfig,
	type NgteWheelInfo,
} from './vehicle-context';

interface ResolvedVehicleOptions {
	enable: boolean;
	carConfig: Required<NgteCarConfig>;
	droneConfig: Required<NgteDroneConfig>;
	enableCustomGravity: boolean;
	gravityDirLerpSpeed: number;
}

const DEFAULT_VEHICLE_OPTIONS: Required<Omit<NgteEcctrlVehicleOptions, 'carConfig' | 'droneConfig'>> & {
	carConfig: NgteCarConfig;
	droneConfig: NgteDroneConfig;
} = {
	enable: true,
	carConfig: {},
	droneConfig: {},
	enableCustomGravity: false,
	gravityDirLerpSpeed: 6,
};

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

function initialVehicleInput(): Required<NgteVehicleInput> {
	return {
		forward: false,
		backward: false,
		steerLeft: false,
		steerRight: false,
		brake: false,
		throttleUp: false,
		throttleDown: false,
		yawLeft: false,
		yawRight: false,
		pitchForward: false,
		pitchBackward: false,
		rollLeft: false,
		rollRight: false,
		joystickL: { x: 0, y: 0 },
		joystickR: { x: 0, y: 0 },
	};
}

function copyVector(value: Exclude<NgtVector3, number>, target: THREE.Vector3) {
	if (Array.isArray(value)) target.set(value[0], value[1], value[2]);
	else target.set(value.x, value.y, value.z);
	return target;
}

function fromRapierVector(value: { x: number; y: number; z: number }, target: THREE.Vector3) {
	return target.set(value.x, value.y, value.z);
}

function toRapierVector(value: THREE.Vector3) {
	return { x: value.x, y: value.y, z: value.z };
}

function createProjectedRigidBodyAdapter(
	vehicle: NgteEcctrlVehicle,
	options: Signal<NgtrRigidBodyOptions>,
): NgtrRigidBody {
	return {
		rigidBody: vehicle.rigidBody,
		get objectRef() {
			return vehicle.objectRef;
		},
		options,
		wake: vehicle.wake,
		sleep: vehicle.sleep,
		collisionEnter: vehicle.collisionEnter,
		collisionExit: vehicle.collisionExit,
		intersectionEnter: vehicle.intersectionEnter,
		intersectionExit: vehicle.intersectionExit,
		contactForce: vehicle.contactForce,
	} as unknown as NgtrRigidBody;
}

function projectOnPlane(value: THREE.Vector3, normal: THREE.Vector3, target: THREE.Vector3) {
	return target.copy(value).addScaledVector(normal, -value.dot(normal));
}

function clampLength(value: THREE.Vector3, max: number) {
	const length = value.length();
	if (length > max && length > 0) value.multiplyScalar(max / length);
	return value;
}

function slerpDirection(
	current: THREE.Vector3,
	target: THREE.Vector3,
	t: number,
	fallback: THREE.Vector3,
	tempStart: THREE.Vector3,
	tempRelative: THREE.Vector3,
) {
	tempStart.copy(current);
	if (tempStart.lengthSq() < 1e-12) tempStart.copy(target);
	tempStart.normalize();
	tempRelative.copy(target).normalize();
	const dot = THREE.MathUtils.clamp(tempStart.dot(tempRelative), -1, 1);
	if (dot > 1 - 1e-7) return current.copy(tempStart);
	if (dot < -1 + 1e-7) {
		tempRelative.copy(fallback).addScaledVector(tempStart, -fallback.dot(tempStart));
		if (tempRelative.lengthSq() < 1e-12) {
			tempRelative.set(1, 0, 0).addScaledVector(tempStart, -tempStart.x);
		}
		tempRelative.normalize();
		return current
			.copy(tempStart)
			.multiplyScalar(Math.cos(Math.PI * t))
			.addScaledVector(tempRelative, Math.sin(Math.PI * t));
	}
	const angle = Math.acos(dot);
	const sinAngle = Math.sin(angle);
	return current
		.copy(tempStart)
		.multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
		.addScaledVector(tempRelative, Math.sin(t * angle) / sinAngle)
		.normalize();
}

/**
 * Physics-driven car and drone body. Shape-cast wheels and thrust propellers
 * projected inside this component register as deterministic child modules.
 */
@Component({
	selector: 'ngte-ecctrl-vehicle',
	exportAs: 'ecctrlVehicle',
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
			<ng-content />
		</ngt-object3D>
	`,
	imports: [NgtrRigidBody],
	providers: [
		{
			provide: NGTE_ECCTRL_VEHICLE_CONTEXT,
			useExisting: forwardRef(() => NgteEcctrlVehicle),
		},
		// Projected Rapier colliders need the internally-owned body. This adapter
		// exposes the rigid-body options and events those directives consume.
		{
			provide: NgtrRigidBody,
			useFactory: (vehicle: NgteEcctrlVehicle) => vehicle.ɵprojectedRigidBody,
			deps: [forwardRef(() => NgteEcctrlVehicle)],
		},
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteEcctrlVehicle implements NgteEcctrlVehicleContext {
	options = input(DEFAULT_VEHICLE_OPTIONS, { transform: mergeInputs(DEFAULT_VEHICLE_OPTIONS) });
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>();
	quaternion = input<NgtQuaternion>();
	scale = input<NgtVector3>([1, 1, 1]);
	userData = input<NgtThreeElements['ngt-object3D']['userData']>();
	rigidBodyOptions = input<Partial<NgtrRigidBodyOptions>>({});
	movement = model<NgteVehicleInput>(initialVehicleInput());

	wake = output<void>();
	sleep = output<void>();
	collisionEnter = output<NgtrCollisionEnterPayload>();
	collisionExit = output<NgtrCollisionExitPayload>();
	intersectionEnter = output<NgtrIntersectionEnterPayload>();
	intersectionExit = output<NgtrIntersectionExitPayload>();
	contactForce = output<NgtrContactForcePayload>();

	private readonly gravity = inject(NgteEcctrlGravity);
	private readonly rigidBodyDirective = viewChild<NgtrRigidBody>('rigidBody');
	/** Rapier-body signal used both publicly and by projected collider directives. */
	readonly rigidBody = computed(() => this.rigidBodyDirective()?.rigidBody() ?? null);
	readonly body = this.rigidBody;
	/** Object ref used by projected collider state registration. */
	get objectRef(): ElementRef<THREE.Object3D> {
		const objectRef = this.rigidBodyDirective()?.objectRef;
		if (!objectRef) throw new Error('[NGTE Ecctrl] vehicle body is not ready.');
		return objectRef;
	}

	protected readonly bodyOptions = computed<NgtrRigidBodyOptions>(() => ({
		...DEFAULT_RIGID_BODY_OPTIONS,
		...this.rigidBodyOptions(),
	}));
	/** @internal Rigid-body contract consumed by projected collider directives. */
	readonly ɵprojectedRigidBody = createProjectedRigidBodyAdapter(this, this.bodyOptions);
	private readonly resolvedOptions = computed<ResolvedVehicleOptions>(() => {
		const options = this.options();
		return {
			enable: options.enable ?? true,
			carConfig: { ...DEFAULT_ECCTRL_CAR_CONFIG, ...options.carConfig },
			droneConfig: { ...DEFAULT_ECCTRL_DRONE_CONFIG, ...options.droneConfig },
			enableCustomGravity: options.enableCustomGravity ?? false,
			gravityDirLerpSpeed: options.gravityDirLerpSpeed ?? 6,
		};
	});

	private readonly wheels = new Map<string, NgteWheelInfo>();
	private readonly propellers = new Map<string, NgtePropellerInfo>();
	private readonly vUpAxis = new THREE.Vector3(0, 1, 0);
	private readonly vGravityDir = new THREE.Vector3(0, -1, 0);
	private gravityMagnitude = 9.81;
	private readonly vCurrPos = new THREE.Vector3();
	private readonly qCurrQuat = new THREE.Quaternion();
	private readonly vCurrLinVel = new THREE.Vector3();
	private readonly vCurrAngVel = new THREE.Vector3();
	private readonly vBodyXAxis = new THREE.Vector3(1, 0, 0);
	private readonly vBodyYAxis = new THREE.Vector3(0, 1, 0);
	private readonly vBodyZAxis = new THREE.Vector3(0, 0, 1);
	private readonly vTargetPos = new THREE.Vector3();
	private readonly vTargetFwd = new THREE.Vector3();
	private readonly vReferenceGravity = new THREE.Vector3(0, -9.81, 0);
	private readonly vReferenceGravityDir = new THREE.Vector3(0, -1, 0);
	private readonly vSlerpStart = new THREE.Vector3();
	private readonly vSlerpRelative = new THREE.Vector3();
	private readonly qInverse = new THREE.Quaternion();
	private readonly vWorldX = new THREE.Vector3();
	private readonly vWorldZ = new THREE.Vector3();
	private readonly vTargetVelocity = new THREE.Vector3();
	private readonly vVelocityError = new THREE.Vector3();
	private readonly vHorizontal = new THREE.Vector3();
	private readonly vHorizontalVelocity = new THREE.Vector3();
	private readonly vHorizontalError = new THREE.Vector3();
	private readonly vTargetUp = new THREE.Vector3();
	private readonly vTiltError = new THREE.Vector3();
	private readonly vTiltAngularVelocity = new THREE.Vector3();
	private readonly vTargetHeading = new THREE.Vector3();
	private readonly vCurrentHeading = new THREE.Vector3();
	private readonly vHeadingCross = new THREE.Vector3();
	private readonly vTorqueWorld = new THREE.Vector3();
	private readonly vTorqueBody = new THREE.Vector3();
	private readonly vDragImpulse = new THREE.Vector3();

	private gear = 0;
	private currentDriveRatio = 10;
	private currentEngineRPM = 0;
	private maxWheelAngularVelocity = 0;
	private shiftCooldownRemaining = 0;
	private engineTorqueCurveLut: NgteEcctrlCurveLut = bakeCurveLut(DEFAULT_ECCTRL_CAR_CONFIG.engineTorqueCurveData);
	private steerAngleCurveLut: NgteEcctrlCurveLut = bakeCurveLut(DEFAULT_ECCTRL_CAR_CONFIG.steerAngleCurveData);

	readonly state: NgteEcctrlVehicleRuntimeState;
	readonly handle: NgteEcctrlVehicleHandle;

	constructor() {
		const vehicle = this;
		this.state = {
			get body() {
				return vehicle.body();
			},
			get upAxis() {
				return vehicle.vUpAxis;
			},
			get gravityDir() {
				return vehicle.vGravityDir;
			},
			get gravityMag() {
				return vehicle.gravityMagnitude;
			},
			get currPos() {
				return vehicle.vCurrPos;
			},
			get currQuat() {
				return vehicle.qCurrQuat;
			},
			get currLinVel() {
				return vehicle.vCurrLinVel;
			},
			get currAngVel() {
				return vehicle.vCurrAngVel;
			},
			get bodyXAxis() {
				return vehicle.vBodyXAxis;
			},
			get bodyYAxis() {
				return vehicle.vBodyYAxis;
			},
			get bodyZAxis() {
				return vehicle.vBodyZAxis;
			},
			get input() {
				return vehicle.movement() as NgteReadonlyVehicleInput;
			},
		};
		this.handle = {
			get body() {
				return vehicle.body();
			},
			get upAxis() {
				return vehicle.vUpAxis;
			},
			get gravityDir() {
				return vehicle.vGravityDir;
			},
			get gravityMag() {
				return vehicle.gravityMagnitude;
			},
			get currPos() {
				return vehicle.vCurrPos;
			},
			get currQuat() {
				return vehicle.qCurrQuat;
			},
			get currLinVel() {
				return vehicle.vCurrLinVel;
			},
			get currAngVel() {
				return vehicle.vCurrAngVel;
			},
			get bodyXAxis() {
				return vehicle.vBodyXAxis;
			},
			get bodyYAxis() {
				return vehicle.vBodyYAxis;
			},
			get bodyZAxis() {
				return vehicle.vBodyZAxis;
			},
			get targetPos() {
				return vehicle.vTargetPos;
			},
			get targetFwd() {
				return vehicle.vTargetFwd;
			},
			get input() {
				return vehicle.movement() as NgteReadonlyVehicleInput;
			},
			get wheelsInfo() {
				return vehicle.wheels;
			},
			get propellersInfo() {
				return vehicle.propellers;
			},
			get gearIndex() {
				return vehicle.gear;
			},
			get driveRatio() {
				return vehicle.currentDriveRatio;
			},
			get engineRPM() {
				return vehicle.currentEngineRPM;
			},
			setMovement(input) {
				vehicle.setMovement(input);
			},
			setTarget(position, forward) {
				vehicle.setTarget(position, forward);
			},
			setGear(index) {
				vehicle.setGear(index);
			},
		};

		beforePhysicsStep((world) => this.step(world));
		effect(() => {
			const body = this.body();
			if (body) body.setEnabled(this.resolvedOptions().enable);
		});
		effect(() => {
			const config = this.resolvedOptions().carConfig;
			this.engineTorqueCurveLut = bakeCurveLut(config.engineTorqueCurveData);
			this.steerAngleCurveLut = bakeCurveLut(config.steerAngleCurveData);
			this.refreshTransmission(false);
		});
	}

	setMovement(update: Partial<NgteVehicleInput>) {
		this.movement.update((current) => {
			const next = { ...current };
			for (const [key, value] of Object.entries(update) as [
				keyof NgteVehicleInput,
				NgteVehicleInput[keyof NgteVehicleInput],
			][]) {
				if (value === undefined) continue;
				if (key === 'joystickL' || key === 'joystickR') {
					(next as Record<string, unknown>)[key] = { ...(value as { x: number; y: number }) };
				} else (next as Record<string, unknown>)[key] = value;
			}
			return next;
		});
	}

	setTarget(position?: Exclude<NgtVector3, number>, forward?: Exclude<NgtVector3, number>) {
		if (position) copyVector(position, this.vTargetPos);
		if (forward) copyVector(forward, this.vTargetFwd);
	}

	setGear(index: number) {
		const ratios = this.gearRatios();
		const next = THREE.MathUtils.clamp(Math.floor(index), 0, ratios.length - 1);
		if (next === this.gear) return;
		this.gear = next;
		this.shiftCooldownRemaining = this.resolvedOptions().carConfig.shiftCooldown;
		this.refreshTransmission(false);
	}

	registerWheel(wheel: NgteWheelInfo) {
		if (this.wheels.has(wheel.id)) return;
		this.wheels.set(wheel.id, wheel);
		this.syncWheelConfig();
	}

	unregisterWheel(id: string) {
		if (this.wheels.delete(id)) this.syncWheelConfig();
	}

	registerPropeller(propeller: NgtePropellerInfo) {
		if (!this.propellers.has(propeller.id)) this.propellers.set(propeller.id, propeller);
	}

	unregisterPropeller(id: string) {
		this.propellers.delete(id);
	}

	private step(world: World) {
		const body = this.body();
		const options = this.resolvedOptions();
		if (!body || !options.enable) return;
		const delta = world.timestep;
		if (!Number.isFinite(delta) || delta <= 0) return;

		if (!body.isSleeping()) this.updateVehicleState(body, world, delta, options);
		if (this.wheels.size > 0) this.stepCar(body, world, delta, options.carConfig);
		if (this.propellers.size > 0) this.stepDrone(body, delta, options.droneConfig);
	}

	private updateVehicleState(body: RigidBody, world: World, delta: number, options: ResolvedVehicleOptions) {
		fromRapierVector(body.translation(), this.vCurrPos);
		fromRapierVector(body.linvel(), this.vCurrLinVel);
		fromRapierVector(body.angvel(), this.vCurrAngVel);
		const rotation = body.rotation();
		this.qCurrQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		this.vBodyXAxis.set(1, 0, 0).applyQuaternion(this.qCurrQuat).normalize();
		this.vBodyYAxis.set(0, 1, 0).applyQuaternion(this.qCurrQuat).normalize();
		this.vBodyZAxis.set(0, 0, 1).applyQuaternion(this.qCurrQuat).normalize();

		if (options.enableCustomGravity) {
			this.gravity.resolveGravity(this.vCurrPos, this.vReferenceGravity);
			this.gravity.applyGravityField(body, delta, this.vCurrPos);
		} else this.vReferenceGravity.set(world.gravity.x, world.gravity.y, world.gravity.z);

		this.gravityMagnitude = this.vReferenceGravity.length();
		if (this.gravityMagnitude > 1e-8) this.vReferenceGravityDir.copy(this.vReferenceGravity).normalize();
		else this.vReferenceGravityDir.copy(this.vBodyYAxis).negate();
		slerpDirection(
			this.vGravityDir,
			this.vReferenceGravityDir,
			1 - Math.exp(-options.gravityDirLerpSpeed * delta),
			this.vBodyZAxis,
			this.vSlerpStart,
			this.vSlerpRelative,
		);
		this.vUpAxis.copy(this.vGravityDir).negate();
	}

	private stepCar(body: RigidBody, world: World, delta: number, config: Required<NgteCarConfig>) {
		this.updateTransmission(delta, config);
		const input = this.movement();
		const drive = THREE.MathUtils.clamp(Number(!!input.forward) - Number(!!input.backward), -1, 1);
		const steer = THREE.MathUtils.clamp(
			Number(!!input.steerLeft) - Number(!!input.steerRight) - (input.joystickL?.x ?? 0),
			-1,
			1,
		);
		const brake = input.brake ? 1 : 0;

		for (const wheel of this.wheels.values()) {
			wheel.setDemand({
				drive: wheel.driveWheel ? drive : 0,
				steer: wheel.steerWheel ? steer : 0,
				brake: wheel.brakeWheel ? brake : 0,
			});
			wheel.step(world, delta);
		}

		if (body.isSleeping()) {
			const shouldWake = [...this.wheels.values()].some(
				(wheel) => wheel.hasContact && (wheel.isOnPlatform || Math.abs(wheel.wheelLinVel) > 1e-4),
			);
			if (!shouldWake) return;
			body.wakeUp();
		}

		for (const wheel of this.wheels.values()) {
			if (!wheel.hasContact) continue;
			this.applyImpulseAtPoint(body, wheel.suspensionImpulse, wheel.suspensionPoint);
			this.applyImpulseAtPoint(body, wheel.longitudinalImpulse, wheel.contactPoint);
			this.applyImpulseAtPoint(body, wheel.lateralImpulse, wheel.contactPoint);
		}
	}

	private applyImpulseAtPoint(body: RigidBody, impulse: THREE.Vector3, point: THREE.Vector3) {
		if (impulse.lengthSq() > 0) body.applyImpulseAtPoint(toRapierVector(impulse), toRapierVector(point), false);
	}

	private updateTransmission(delta: number, config: Required<NgteCarConfig>) {
		let weightedRpm = 0;
		let totalWeight = 0;
		for (const wheel of this.wheels.values()) {
			if (!wheel.driveWheel) continue;
			const weight = Math.max(0, wheel.driveTorqueWeight);
			weightedRpm += Math.abs(wheel.wheelAngVel) * (60 / (Math.PI * 2)) * weight;
			totalWeight += weight;
		}
		this.currentEngineRPM = (totalWeight > 0 ? weightedRpm / totalWeight : 0) * Math.abs(this.currentDriveRatio);

		if (config.transmissionMode !== 'auto' || this.gearRatios().length <= 1) return;
		if (this.shiftCooldownRemaining > 0) {
			this.shiftCooldownRemaining -= delta;
			return;
		}
		if (this.currentEngineRPM > config.shiftUpRPM && this.gear < this.gearRatios().length - 1) {
			this.setGear(this.gear + 1);
		} else if (this.currentEngineRPM < config.shiftDownRPM && this.gear > 0) this.setGear(this.gear - 1);
	}

	private gearRatios() {
		const ratios = this.resolvedOptions().carConfig.gearRatios;
		return ratios.length > 0 ? ratios : DEFAULT_ECCTRL_CAR_CONFIG.gearRatios;
	}

	private refreshTransmission(resetCooldown: boolean) {
		const config = this.resolvedOptions().carConfig;
		const ratios = this.gearRatios();
		this.gear = THREE.MathUtils.clamp(Math.floor(this.gear), 0, ratios.length - 1);
		this.currentDriveRatio = (ratios[this.gear] ?? ratios[0] ?? 0) * config.finalDriveRatio;
		this.maxWheelAngularVelocity =
			this.currentDriveRatio !== 0 ? (config.engineMaxRPM / this.currentDriveRatio) * ((Math.PI * 2) / 60) : 0;
		if (resetCooldown) this.shiftCooldownRemaining = config.shiftCooldown;
		this.syncWheelConfig();
	}

	private syncWheelConfig() {
		const config = this.resolvedOptions().carConfig;
		const engineMaxTorque = config.engineMaxRPM !== 0 ? (config.engineHorsepower * 7022) / config.engineMaxRPM : 0;
		let totalWeight = 0;
		for (const wheel of this.wheels.values()) {
			if (wheel.driveWheel) totalWeight += Math.max(0, wheel.driveTorqueWeight);
		}
		for (const wheel of this.wheels.values()) {
			const weight = Math.max(0, wheel.driveTorqueWeight);
			const wheelConfig: NgteWheelControlConfig = {
				maxDriveTorque: wheel.driveWheel && totalWeight > 0 ? (engineMaxTorque * weight) / totalWeight : 0,
				maxWheelAngVel: this.maxWheelAngularVelocity,
				driveRatio: this.currentDriveRatio,
				reverseTorqueScale: config.reverseTorqueScale,
				reverseRPMScale: config.reverseRPMScale,
				engineTorqueCurveLut: this.engineTorqueCurveLut,
				steerAngleCurveLut: this.steerAngleCurveLut,
				steerRate: config.steerRate,
				maxSteerAngle: config.maxSteerAngle,
			};
			wheel.configure(wheelConfig);
		}
	}

	private stepDrone(body: RigidBody, delta: number, config: Required<NgteDroneConfig>) {
		for (const propeller of this.propellers.values()) propeller.prepare(delta);
		let sumLX = 0;
		let sumLY = 0;
		let sumLZ = 0;
		let sumAX = 0;
		let sumAY = 0;
		let sumAZ = 0;
		for (const propeller of this.propellers.values()) {
			sumLX += propeller.lx;
			sumLY += propeller.ly;
			sumLZ += propeller.lz;
			sumAX += Math.abs(propeller.ax);
			sumAY += Math.abs(propeller.ay);
			sumAZ += Math.abs(propeller.az);
		}
		const sumWorldLY =
			sumLX * this.vBodyXAxis.dot(this.vUpAxis) +
			sumLY * this.vBodyYAxis.dot(this.vUpAxis) +
			sumLZ * this.vBodyZAxis.dot(this.vUpAxis);
		const weight = body.mass() * this.gravityMagnitude;
		let hover = 0;

		if (config.controlMode === 'POSITION') {
			this.vVelocityError.copy(this.vTargetPos).sub(this.vCurrPos);
			const verticalError = this.vVelocityError.dot(this.vUpAxis);
			projectOnPlane(this.vVelocityError, this.vUpAxis, this.vHorizontalError);
			const verticalVelocity = this.vCurrLinVel.dot(this.vUpAxis);
			projectOnPlane(this.vCurrLinVel, this.vUpAxis, this.vHorizontalVelocity);
			const verticalForce =
				weight +
				THREE.MathUtils.clamp(
					verticalError * config.VERT_POS_P,
					-config.VERT_POS_D * config.maxVertSpeed,
					config.VERT_POS_D * config.maxVertSpeed,
				) -
				verticalVelocity * config.VERT_POS_D;
			hover = Math.max(0, verticalForce / (sumWorldLY || 1));
			this.vHorizontal
				.copy(this.vHorizontalError)
				.multiplyScalar(config.HORIZ_POS_P)
				.addScaledVector(this.vHorizontalVelocity, -config.HORIZ_POS_D);
			clampLength(this.vHorizontal, config.HORIZ_POS_D * config.maxHorizSpeed);
			this.vTargetUp
				.copy(this.vUpAxis)
				.multiplyScalar(weight)
				.add(clampLength(this.vHorizontal, weight * Math.tan(config.maxTiltAngle)))
				.normalize();
			this.calculateDroneTorque(config, this.positionYawRate(config));
		} else {
			const input = this.movement();
			const throttle = THREE.MathUtils.clamp(
				Number(!!input.throttleUp) - Number(!!input.throttleDown) + (input.joystickL?.y ?? 0),
				-1,
				1,
			);
			const yaw = THREE.MathUtils.clamp(
				Number(!!input.yawLeft) - Number(!!input.yawRight) - (input.joystickL?.x ?? 0),
				-1,
				1,
			);
			const pitch = THREE.MathUtils.clamp(
				Number(!!input.pitchForward) - Number(!!input.pitchBackward) + (input.joystickR?.y ?? 0),
				-1,
				1,
			);
			const roll = THREE.MathUtils.clamp(
				Number(!!input.rollRight) - Number(!!input.rollLeft) + (input.joystickR?.x ?? 0),
				-1,
				1,
			);
			projectOnPlane(this.vBodyXAxis, this.vUpAxis, this.vWorldX).normalize();
			projectOnPlane(this.vBodyZAxis, this.vUpAxis, this.vWorldZ).normalize();
			this.vTargetVelocity
				.copy(this.vWorldX)
				.multiplyScalar(-roll * config.maxHorizSpeed)
				.addScaledVector(this.vWorldZ, pitch * config.maxHorizSpeed)
				.addScaledVector(this.vUpAxis, throttle * config.maxVertSpeed);
			this.vVelocityError.copy(this.vTargetVelocity).sub(this.vCurrLinVel);
			const verticalAcceleration = THREE.MathUtils.clamp(
				this.vVelocityError.dot(this.vUpAxis) * config.VERT_VEL_P,
				-this.gravityMagnitude,
				this.gravityMagnitude,
			);
			projectOnPlane(this.vVelocityError, this.vUpAxis, this.vHorizontal).multiplyScalar(config.HORIZ_VEL_P);
			clampLength(this.vHorizontal, this.gravityMagnitude * Math.tan(config.maxTiltAngle));
			hover = Math.max(0, (weight + verticalAcceleration * body.mass()) / (sumWorldLY || 1));
			this.vTargetUp.copy(this.vUpAxis).multiplyScalar(this.gravityMagnitude).add(this.vHorizontal).normalize();
			this.calculateDroneTorque(config, yaw * config.maxYawRate - this.vCurrAngVel.dot(this.vUpAxis));
		}

		const throttles: [NgtePropellerInfo, number][] = [];
		const safeMix = Math.min(1 - hover, hover);
		for (const propeller of this.propellers.values()) {
			const mix =
				(this.vTorqueBody.x * propeller.ax) / (sumAX || 1) +
				(this.vTorqueBody.z * propeller.az) / (sumAZ || 1) +
				(this.vTorqueBody.y * propeller.ay) / (sumAY || 1);
			const throttle = THREE.MathUtils.clamp(hover + THREE.MathUtils.clamp(mix, -safeMix, safeMix), 0, 1);
			throttles.push([propeller, throttle]);
		}

		if (body.isSleeping()) {
			if (!throttles.some(([propeller, throttle]) => Math.abs(throttle - propeller.currentThrottle) > 1e-4))
				return;
			body.wakeUp();
		}
		for (const [propeller, throttle] of throttles) {
			propeller.setThrottle(throttle);
			propeller.apply(delta);
		}
		this.vDragImpulse.copy(this.vCurrLinVel).multiplyScalar(-config.airDragFactor * delta);
		body.applyImpulse(toRapierVector(this.vDragImpulse), false);
	}

	private positionYawRate(config: Required<NgteDroneConfig>) {
		projectOnPlane(this.vTargetFwd, this.vUpAxis, this.vTargetHeading).normalize();
		projectOnPlane(this.vBodyZAxis, this.vUpAxis, this.vCurrentHeading).normalize();
		const angle = this.vCurrentHeading.angleTo(this.vTargetHeading);
		const sign = Math.sign(
			this.vHeadingCross.crossVectors(this.vCurrentHeading, this.vTargetHeading).dot(this.vUpAxis),
		);
		const targetYawRate = THREE.MathUtils.clamp(
			angle * sign * config.YAW_POS_P,
			-config.maxYawRate,
			config.maxYawRate,
		);
		return targetYawRate - this.vCurrAngVel.dot(this.vUpAxis);
	}

	private calculateDroneTorque(config: Required<NgteDroneConfig>, yawRateError: number) {
		this.vTiltError.crossVectors(this.vBodyYAxis, this.vTargetUp);
		projectOnPlane(this.vCurrAngVel, this.vUpAxis, this.vTiltAngularVelocity);
		this.vTorqueWorld
			.copy(this.vTiltError)
			.multiplyScalar(config.TILT_P)
			.addScaledVector(this.vTiltAngularVelocity, -config.TILT_D)
			.addScaledVector(this.vUpAxis, yawRateError * config.YAW_VEL_P);
		this.qInverse.copy(this.qCurrQuat).invert();
		this.vTorqueBody.copy(this.vTorqueWorld).applyQuaternion(this.qInverse);
	}
}
