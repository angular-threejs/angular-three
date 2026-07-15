import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import type {
	Collider,
	ColliderShapeCastHit,
	RayColliderIntersection,
	RigidBody,
	World,
} from '@dimforge/rapier3d-compat';
import type { NgtEuler, NgtQuaternion, NgtVector3 } from 'angular-three';
import type { NgteEcctrlUserData } from 'angular-three-ecctrl';
import { bakeCurveLut, evaluateCurveLut, type NgteEcctrlCurveData } from 'angular-three-ecctrl/curves';
import { NgtrPhysics } from 'angular-three-rapier';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import {
	NGTE_ECCTRL_VEHICLE_CONTEXT,
	type NgteEcctrlVehicleContext,
	type NgteWheelControlConfig,
	type NgteWheelControlDemand,
	type NgteWheelInfo,
} from './vehicle-context';

export type NgteWheelGroundDetection = 'shapeCast' | 'rayCast';

export interface NgteShapeCastWheelOptions {
	debug?: boolean;
	enable?: boolean;
	name?: string;
	groundDetection?: NgteWheelGroundDetection;
	rayShapeR?: number;
	rayShapeH?: number;
	rayLength?: number;
	springK?: number;
	dampingC?: number;
	driveInvert?: boolean;
	driveWheel?: boolean;
	driveTorqueWeight?: number;
	steerInvert?: boolean;
	steerWheel?: boolean;
	brakeWheel?: boolean;
	maxBrakeTorque?: number;
	rollingResistanceCoef?: number;
	lowVelThreshold?: number;
	tireGripFactor?: number;
	lngFrictionEllipseScale?: number;
	latFrictionEllipseScale?: number;
	relaxLngRate?: number;
	relaxLatRate?: number;
	minLngRelaxCoeff?: number;
	minLatRelaxCoeff?: number;
	lngSlipRatioCurveData?: NgteEcctrlCurveData;
	latSlipRatioCurveData?: NgteEcctrlCurveData;
	followPlatform?: boolean;
	massRatioFallOffCurveData?: NgteEcctrlCurveData;
	applyCounterMass?: boolean;
	applyCounterFriction?: boolean;
	showWheelModel?: boolean;
	wheelModelDensity?: number;
	wheelModelUpdate?: boolean;
	wheelModelRadius?: number;
	wheelModelLerpPosRate?: number;
	/** Upstream spelling retained. */
	wheelModelReversRotation?: boolean;
	debuggerArrowScale?: number;
}

const DEFAULT_LONGITUDINAL_CURVE: NgteEcctrlCurveData = {
	points: [
		{ x: 0, y: 0, r_out: 1.45 },
		{ x: 0.25, y: 1, r_in: 0, r_out: 0 },
		{ x: 1, y: 0.7, r_in: 0 },
	],
};

const DEFAULT_LATERAL_CURVE: NgteEcctrlCurveData = {
	points: [
		{ x: 0, y: 0, r_out: 1.45 },
		{ x: 0.15, y: 1, r_in: 0, r_out: 0 },
		{ x: 1, y: 0.9, r_in: 0 },
	],
};

const DEFAULT_MASS_RATIO_CURVE: NgteEcctrlCurveData = {
	points: [
		{ x: 0, y: 0.5, r_out: 0 },
		{ x: 0.5, y: 1, r_out: 0 },
		{ x: 1, y: 1, r_in: 0 },
	],
};

export const DEFAULT_ECCTRL_SHAPE_CAST_WHEEL_OPTIONS: Required<NgteShapeCastWheelOptions> = {
	debug: false,
	enable: true,
	name: '',
	groundDetection: 'shapeCast',
	rayShapeR: 0.5,
	rayShapeH: 0.15,
	rayLength: 0.5,
	springK: 180,
	dampingC: 16,
	driveInvert: false,
	driveWheel: false,
	driveTorqueWeight: 1,
	steerInvert: false,
	steerWheel: false,
	brakeWheel: false,
	maxBrakeTorque: 40,
	rollingResistanceCoef: 0.007,
	lowVelThreshold: 0.4,
	tireGripFactor: 1.5,
	lngFrictionEllipseScale: 1,
	latFrictionEllipseScale: 1,
	relaxLngRate: 0.05,
	relaxLatRate: 0.1,
	minLngRelaxCoeff: 0.3,
	minLatRelaxCoeff: 0.3,
	lngSlipRatioCurveData: DEFAULT_LONGITUDINAL_CURVE,
	latSlipRatioCurveData: DEFAULT_LATERAL_CURVE,
	followPlatform: true,
	massRatioFallOffCurveData: DEFAULT_MASS_RATIO_CURVE,
	applyCounterMass: true,
	applyCounterFriction: true,
	showWheelModel: true,
	wheelModelDensity: 1.5,
	wheelModelUpdate: true,
	wheelModelRadius: 0.5,
	wheelModelLerpPosRate: 10,
	wheelModelReversRotation: false,
	debuggerArrowScale: 10,
};

function toRapierVector(value: THREE.Vector3) {
	return { x: value.x, y: value.y, z: value.z };
}

function fromRapierVector(value: { x: number; y: number; z: number }, target: THREE.Vector3) {
	return target.set(value.x, value.y, value.z);
}

function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
	return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Suspension, tire, steering, and wheel-rotation module for an Ecctrl vehicle. */
@Component({
	selector: 'ngte-shape-cast-wheel',
	exportAs: 'shapeCastWheel',
	template: `
		<ngt-group
			#wheelRoot
			[position]="position()"
			[rotation]="rotation()"
			[quaternion]="quaternion()"
			[scale]="scale()"
		>
			@if (resolvedOptions().showWheelModel) {
				<ngt-group #wheel>
					<ngt-group #model>
						<ng-content />
					</ngt-group>
				</ngt-group>
			}
			@if (resolvedOptions().debug) {
				<ngt-axes-helper [scale]="resolvedOptions().rayShapeR * 1.5" />
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteShapeCastWheel {
	id = input<string | number>();
	options = input(DEFAULT_ECCTRL_SHAPE_CAST_WHEEL_OPTIONS, {
		transform: mergeInputs(DEFAULT_ECCTRL_SHAPE_CAST_WHEEL_OPTIONS),
	});
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>();
	quaternion = input<NgtQuaternion>();
	scale = input<NgtVector3>([1, 1, 1]);

	protected readonly resolvedOptions = computed(() => ({
		...DEFAULT_ECCTRL_SHAPE_CAST_WHEEL_OPTIONS,
		...this.options(),
	}));
	private readonly context = inject<NgteEcctrlVehicleContext>(NGTE_ECCTRL_VEHICLE_CONTEXT);
	private readonly physics = inject(NgtrPhysics);
	private readonly rootRef = viewChild<ElementRef<THREE.Group>>('wheelRoot');
	private readonly wheelRef = viewChild<ElementRef<THREE.Group>>('wheel');
	private readonly modelRef = viewChild<ElementRef<THREE.Group>>('model');
	private stableId = THREE.MathUtils.generateUUID();
	private config: NgteWheelControlConfig | null = null;
	private demand: NgteWheelControlDemand = { drive: 0, steer: 0, brake: 0 };

	private wheelAngularVelocity = 0;
	private wheelLinearVelocity = 0;
	private currentSteerAngle = 0;
	private currentDriveTorque = 0;
	private currentBrakeTorque = 0;
	private steerTarget = 0;
	private steerIncrement = 0;
	private suspensionToi = 0;
	private currentFriction = 0;
	private effectiveInertia = 0;
	private supportForceMagnitude = 0;
	private longitudinalSlipRatio = 0;
	private lateralSlipRatio = 0;
	private currentSlipStrength = 0;
	private smoothedLongitudinalImpulse = 0;
	private smoothedLateralImpulse = 0;
	private platformMassRatio = 1;
	private onPlatform = false;

	private shapeHit: ColliderShapeCastHit | null = null;
	private rayHitResult: RayColliderIntersection | null = null;
	private hitBody: RigidBody | null = null;
	private readonly vVehiclePosition = new THREE.Vector3();
	private readonly qVehicle = new THREE.Quaternion();
	private readonly vVehicleLinearVelocity = new THREE.Vector3();
	private readonly vVehicleAngularVelocity = new THREE.Vector3();
	private readonly vVehicleZAxis = new THREE.Vector3(0, 0, 1);
	private readonly vRayPosition = new THREE.Vector3();
	private readonly qRayRotation = new THREE.Quaternion();
	private readonly vRayDirection = new THREE.Vector3(0, -1, 0);
	private readonly vRayUp = new THREE.Vector3(0, 1, 0);
	private readonly vRayForward = new THREE.Vector3(0, 0, 1);
	private readonly vRayLeft = new THREE.Vector3(1, 0, 0);
	private readonly vRayOriginVelocity = new THREE.Vector3();
	private readonly vDistanceToVehicle = new THREE.Vector3();
	private readonly vAngularContribution = new THREE.Vector3();
	private readonly vShapeCenter = new THREE.Vector3();
	private readonly vRawHitPoint = new THREE.Vector3();
	private readonly vStableHitPoint = new THREE.Vector3();
	private readonly vHitOffset = new THREE.Vector3();
	private readonly vContactPoint = new THREE.Vector3();
	private readonly vContactNormal = new THREE.Vector3();
	private readonly vSupportPoint = new THREE.Vector3();
	private readonly vRelativePointVelocity = new THREE.Vector3();
	private readonly vMovingVelocity = new THREE.Vector3();
	private readonly vMovingVelocityOnPlane = new THREE.Vector3();
	private readonly vMovingPosition = new THREE.Vector3();
	private readonly vMovingLinearVelocity = new THREE.Vector3();
	private readonly vMovingAngularVelocity = new THREE.Vector3();
	private readonly vMovingOffset = new THREE.Vector3();
	private readonly vMovingAngularContribution = new THREE.Vector3();
	private readonly vLongitudinalAxis = new THREE.Vector3();
	private readonly vLateralAxis = new THREE.Vector3();
	private readonly vSuspensionImpulse = new THREE.Vector3();
	private readonly vLongitudinalImpulse = new THREE.Vector3();
	private readonly vLateralImpulse = new THREE.Vector3();
	private readonly vCounterSupportImpulse = new THREE.Vector3();
	private readonly vCounterFrictionImpulse = new THREE.Vector3();
	private readonly qZ90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);

	private readonly longitudinalCurve = computed(() => bakeCurveLut(this.resolvedOptions().lngSlipRatioCurveData));
	private readonly lateralCurve = computed(() => bakeCurveLut(this.resolvedOptions().latSlipRatioCurveData));
	private readonly massRatioCurve = computed(() => bakeCurveLut(this.resolvedOptions().massRatioFallOffCurveData));

	readonly info: NgteWheelInfo;

	constructor() {
		const wheel = this;
		this.info = {
			get id() {
				return wheel.stableId;
			},
			get driveWheel() {
				return wheel.resolvedOptions().driveWheel;
			},
			get steerWheel() {
				return wheel.resolvedOptions().steerWheel;
			},
			get brakeWheel() {
				return wheel.resolvedOptions().brakeWheel;
			},
			get driveTorqueWeight() {
				return wheel.resolvedOptions().driveTorqueWeight;
			},
			get wheelRadius() {
				return wheel.resolvedOptions().rayShapeR;
			},
			get maxBrakeTorque() {
				return wheel.resolvedOptions().maxBrakeTorque;
			},
			get driveInvert() {
				return wheel.resolvedOptions().driveInvert;
			},
			get steerInvert() {
				return wheel.resolvedOptions().steerInvert;
			},
			get wheelAngVel() {
				return wheel.wheelAngularVelocity;
			},
			get wheelLinVel() {
				return wheel.wheelLinearVelocity;
			},
			get steerAngle() {
				return wheel.currentSteerAngle;
			},
			get hasContact() {
				return !!wheel.currentHit();
			},
			get isOnPlatform() {
				return wheel.onPlatform;
			},
			get contactBody() {
				return wheel.hitBody;
			},
			get suspensionImpulse() {
				return wheel.vSuspensionImpulse;
			},
			get longitudinalImpulse() {
				return wheel.vLongitudinalImpulse;
			},
			get lateralImpulse() {
				return wheel.vLateralImpulse;
			},
			get suspensionPoint() {
				return wheel.vSupportPoint;
			},
			get contactPoint() {
				return wheel.vContactPoint;
			},
			get rayPos() {
				return wheel.vRayPosition;
			},
			get rayDir() {
				return wheel.vRayDirection;
			},
			get rayRot() {
				return wheel.qRayRotation;
			},
			get rayUpDir() {
				return wheel.vRayUp;
			},
			get rayFwdDir() {
				return wheel.vRayForward;
			},
			get rayLeftDir() {
				return wheel.vRayLeft;
			},
			get floatImp() {
				return wheel.vSuspensionImpulse;
			},
			get rayHit() {
				return wheel.currentHit();
			},
			get rayHitBody() {
				return wheel.hitBody;
			},
			get rayHitPos() {
				return wheel.vContactPoint;
			},
			get rayHitNormal() {
				return wheel.vContactNormal;
			},
			get rayHitFriciton() {
				return wheel.currentFriction;
			},
			get rayOriginVel() {
				return wheel.vRayOriginVelocity;
			},
			get rayHitPointVel() {
				return wheel.vRelativePointVelocity;
			},
			get lngSlipRatio() {
				return wheel.longitudinalSlipRatio;
			},
			get latSlipRatio() {
				return wheel.lateralSlipRatio;
			},
			get slipStrength() {
				return wheel.currentSlipStrength;
			},
			get lngAxis() {
				return wheel.vLongitudinalAxis;
			},
			get latAxis() {
				return wheel.vLateralAxis;
			},
			get lngFricImp() {
				return wheel.vLongitudinalImpulse;
			},
			get latFricImp() {
				return wheel.vLateralImpulse;
			},
			get effInertia() {
				return wheel.effectiveInertia;
			},
			get supPos() {
				return wheel.vSupportPoint;
			},
			get driveTorque() {
				return wheel.currentDriveTorque;
			},
			get brakeTorque() {
				return wheel.currentBrakeTorque;
			},
			configure(config) {
				wheel.config = config;
			},
			setDemand(demand) {
				wheel.demand = demand;
			},
			step(world, delta) {
				wheel.step(world, delta);
			},
		};

		effect((onCleanup) => {
			const explicitId = untracked(this.id);
			if (explicitId !== undefined) this.stableId = String(explicitId);
			const options = this.resolvedOptions();
			void options.driveWheel;
			void options.driveTorqueWeight;
			void options.steerWheel;
			this.context.registerWheel(this.info);
			onCleanup(() => this.context.unregisterWheel(this.stableId));
		});
	}

	private currentHit() {
		return this.resolvedOptions().groundDetection === 'rayCast' ? this.rayHitResult : this.shapeHit;
	}

	private step(world: World, delta: number) {
		const options = this.resolvedOptions();
		const body = this.context.state.body;
		const root = this.rootRef()?.nativeElement;
		const rapier = this.physics.rapier();
		if (!body || !root || !rapier || !options.enable || !Number.isFinite(delta) || delta <= 0) {
			this.clearContact();
			return;
		}

		this.updateVehicle(body);
		this.updateControls(options, delta);
		if (options.steerWheel && this.steerIncrement !== 0) root.rotateY(this.steerIncrement);
		root.getWorldPosition(this.vRayPosition);
		root.getWorldQuaternion(this.qRayRotation);
		this.vRayDirection.set(0, -1, 0).applyQuaternion(this.qRayRotation);
		this.vRayUp.copy(this.vRayDirection).negate();
		this.vRayForward.set(0, 0, 1).applyQuaternion(this.qRayRotation);
		this.vRayLeft.crossVectors(this.vRayUp, this.vRayForward).normalize();
		this.vDistanceToVehicle.copy(this.vRayPosition).sub(this.vVehiclePosition);
		this.vAngularContribution.crossVectors(this.vVehicleAngularVelocity, this.vDistanceToVehicle);
		this.vRayOriginVelocity.copy(this.vVehicleLinearVelocity).add(this.vAngularContribution);

		const filter = (collider: Collider) => {
			const userData = collider.parent()?.userData as NgteEcctrlUserData | undefined;
			return !(userData?.ecctrl?.excludeRay || userData?.ecctrl?.excludeVehicleRay);
		};
		if (options.groundDetection === 'rayCast') {
			this.shapeHit = null;
			this.rayHitResult = world.castRayAndGetNormal(
				new rapier.Ray(toRapierVector(this.vRayPosition), toRapierVector(this.vRayDirection)),
				options.rayLength + options.rayShapeR,
				false,
				rapier.QueryFilterFlags.EXCLUDE_SENSORS,
				undefined,
				undefined,
				body,
				filter,
			);
		} else {
			this.rayHitResult = null;
			this.shapeHit = world.castShape(
				toRapierVector(this.vRayPosition),
				this.qRayRotation.clone().multiply(this.qZ90),
				toRapierVector(this.vRayDirection),
				new rapier.Cylinder(options.rayShapeH, options.rayShapeR),
				0,
				options.rayLength,
				false,
				rapier.QueryFilterFlags.EXCLUDE_SENSORS,
				undefined,
				undefined,
				body,
				filter,
			);
		}

		const hit = this.currentHit();
		const collider = hit?.collider;
		const hitDistance =
			options.groundDetection === 'rayCast' ? this.rayHitResult?.timeOfImpact : this.shapeHit?.time_of_impact;
		if (!hit || !collider || hitDistance == null) {
			this.clearContact();
			this.prepareAirborneWheel(options);
			this.solveWheelRotation(options, delta, false);
			this.updateWheelModel(options, delta, false);
			return;
		}

		this.suspensionToi =
			options.groundDetection === 'rayCast' ? Math.max(0, hitDistance - options.rayShapeR) : hitDistance;
		this.hitBody = collider.parent();
		if (options.groundDetection === 'rayCast') {
			this.vRawHitPoint.copy(this.vRayPosition).addScaledVector(this.vRayDirection, hitDistance);
			fromRapierVector(this.rayHitResult!.normal, this.vContactNormal).normalize();
		} else {
			fromRapierVector(this.shapeHit!.witness1, this.vRawHitPoint);
			fromRapierVector(this.shapeHit!.normal1, this.vContactNormal).normalize();
		}
		this.vShapeCenter.copy(this.vRayPosition).addScaledVector(this.vRayDirection, this.suspensionToi);
		let supportOffset = 0;
		if (options.groundDetection === 'rayCast') this.vStableHitPoint.copy(this.vRawHitPoint);
		else {
			const rawOffset = THREE.MathUtils.clamp(
				this.vHitOffset.copy(this.vRawHitPoint).sub(this.vShapeCenter).dot(this.vRayLeft),
				-options.rayShapeH,
				options.rayShapeH,
			);
			this.vStableHitPoint.copy(this.vRawHitPoint).addScaledVector(this.vRayLeft, -rawOffset);
			const normalSide = this.vContactNormal.dot(this.vRayLeft);
			const normalForward = this.vContactNormal.dot(this.vRayForward);
			const sideWeight = THREE.MathUtils.clamp(
				Math.abs(normalSide) / Math.sqrt(Math.max(1 - normalForward * normalForward, 1e-6)),
				0,
				1,
			);
			supportOffset = -Math.abs(rawOffset) * Math.sign(normalSide) * sideWeight;
		}
		this.vContactPoint.copy(this.vStableHitPoint).addScaledVector(this.vRayLeft, supportOffset);
		this.vSupportPoint.copy(this.vShapeCenter).addScaledVector(this.vRayLeft, supportOffset);
		this.currentFriction = collider.friction() ?? 0;
		this.updateMovingSupport(body, options);
		this.vRelativePointVelocity.copy(this.vRayOriginVelocity);
		if (this.onPlatform && options.followPlatform) this.vRelativePointVelocity.sub(this.vMovingVelocity);
		const springForce = options.springK * Math.max(0, options.rayLength - this.suspensionToi);
		const dampingForce = options.dampingC * this.vRelativePointVelocity.dot(this.vRayUp);
		this.vSuspensionImpulse.copy(this.vContactNormal).multiplyScalar((springForce - dampingForce) * delta);
		this.computeFriction(options, delta);
		this.applyCounterImpulses(options, delta);
		this.solveWheelRotation(options, delta, true);
		this.wheelLinearVelocity = this.wheelAngularVelocity * options.rayShapeR;
		this.updateWheelModel(options, delta, true);
	}

	private prepareAirborneWheel(options: Required<NgteShapeCastWheelOptions>) {
		const gravityMagnitude = Math.max(this.context.state.gravityMag, 1e-6);
		const radiusSquared = options.rayShapeR * options.rayShapeR;
		const wheelVolume = Math.PI * radiusSquared * options.rayShapeH * 2;
		const wheelMass = options.wheelModelDensity * wheelVolume;
		const wheelInertia = 0.5 * wheelMass * radiusSquared;
		this.supportForceMagnitude = wheelMass * gravityMagnitude;
		this.effectiveInertia = Math.max(
			wheelInertia + (this.supportForceMagnitude / gravityMagnitude) * radiusSquared,
			1e-8,
		);
	}

	private updateVehicle(body: RigidBody) {
		fromRapierVector(body.translation(), this.vVehiclePosition);
		const rotation = body.rotation();
		this.qVehicle.set(rotation.x, rotation.y, rotation.z, rotation.w);
		fromRapierVector(body.linvel(), this.vVehicleLinearVelocity);
		fromRapierVector(body.angvel(), this.vVehicleAngularVelocity);
		this.vVehicleZAxis.set(0, 0, 1).applyQuaternion(this.qVehicle);
	}

	private updateControls(options: Required<NgteShapeCastWheelOptions>, delta: number) {
		if (options.driveWheel && this.config && this.config.maxDriveTorque !== 0) {
			const maxAngularVelocity =
				this.config.maxWheelAngVel * (this.demand.drive < 0 ? this.config.reverseRPMScale : 1);
			const ratio = maxAngularVelocity > 0 ? Math.abs(this.wheelAngularVelocity) / maxAngularVelocity : 1;
			this.currentDriveTorque =
				this.demand.drive *
				this.config.maxDriveTorque *
				this.config.driveRatio *
				(this.demand.drive < 0 ? this.config.reverseTorqueScale : 1) *
				evaluateCurveLut(this.config.engineTorqueCurveLut, ratio) *
				(options.driveInvert ? -1 : 1);
		} else this.currentDriveTorque = 0;

		if (options.steerWheel && this.config) {
			const speedRatio =
				this.config.maxWheelAngVel > 0
					? THREE.MathUtils.clamp(
							this.vVehicleLinearVelocity.dot(this.vVehicleZAxis) /
								(this.config.maxWheelAngVel * options.rayShapeR),
							0,
							1,
						)
					: 0;
			this.steerTarget =
				this.demand.steer *
				this.config.maxSteerAngle *
				evaluateCurveLut(this.config.steerAngleCurveLut, speedRatio) *
				(options.steerInvert ? -1 : 1);
			const angleDifference = this.steerTarget - this.currentSteerAngle;
			const maxIncrement = this.config.steerRate * delta;
			this.steerIncrement = Math.sign(angleDifference) * Math.min(Math.abs(angleDifference), maxIncrement);
			this.currentSteerAngle += this.steerIncrement;
		} else this.steerIncrement = 0;
		this.currentBrakeTorque = options.brakeWheel ? this.demand.brake * options.maxBrakeTorque : 0;
	}

	private updateMovingSupport(body: RigidBody, options: Required<NgteShapeCastWheelOptions>) {
		const type = this.hitBody?.bodyType();
		if (!options.followPlatform || !this.hitBody || (type !== 0 && type !== 2)) {
			this.onPlatform = false;
			this.platformMassRatio = 1;
			this.vMovingVelocity.set(0, 0, 0);
			this.vMovingVelocityOnPlane.set(0, 0, 0);
			return;
		}
		this.onPlatform = true;
		this.platformMassRatio =
			type === 0
				? evaluateCurveLut(
						this.massRatioCurve(),
						THREE.MathUtils.clamp(this.hitBody.mass() / Math.max(body.mass(), 1e-6), 0, 1),
					)
				: 1;
		fromRapierVector(this.hitBody.translation(), this.vMovingPosition);
		fromRapierVector(this.hitBody.linvel(), this.vMovingLinearVelocity);
		fromRapierVector(this.hitBody.angvel(), this.vMovingAngularVelocity);
		this.vMovingOffset.copy(this.vRayPosition).sub(this.vMovingPosition);
		this.vMovingAngularContribution.crossVectors(this.vMovingAngularVelocity, this.vMovingOffset);
		this.vMovingVelocity
			.copy(this.vMovingLinearVelocity)
			.add(this.vMovingAngularContribution)
			.multiplyScalar(this.platformMassRatio);
		this.vMovingVelocityOnPlane.copy(this.vMovingVelocity).projectOnPlane(this.vContactNormal);
	}

	private computeFriction(options: Required<NgteShapeCastWheelOptions>, delta: number) {
		const gravityMagnitude = Math.max(this.context.state.gravityMag, 1e-6);
		const radiusSquared = options.rayShapeR * options.rayShapeR;
		const wheelVolume = Math.PI * radiusSquared * options.rayShapeH * 2;
		const wheelMass = options.wheelModelDensity * wheelVolume;
		const wheelInertia = 0.5 * wheelMass * radiusSquared;
		const suspensionMagnitude = Math.max(this.vSuspensionImpulse.dot(this.vContactNormal), 0);
		this.supportForceMagnitude = suspensionMagnitude / delta;
		this.effectiveInertia = wheelInertia + (this.supportForceMagnitude / gravityMagnitude) * radiusSquared;
		this.effectiveInertia = Math.max(this.effectiveInertia, 1e-8);
		this.vLongitudinalAxis.copy(this.vRayForward).projectOnPlane(this.vContactNormal).normalize();
		this.vLateralAxis.copy(this.vRayLeft).projectOnPlane(this.vContactNormal).normalize();
		const longitudinalVelocity = this.vRelativePointVelocity.dot(this.vLongitudinalAxis);
		const lateralVelocity = this.vRelativePointVelocity.dot(this.vLateralAxis);
		const longitudinalAbs = Math.abs(longitudinalVelocity);
		const lateralAbs = Math.abs(lateralVelocity);
		const wheelVelocity = this.wheelAngularVelocity * options.rayShapeR;
		const slipDifference = wheelVelocity - longitudinalVelocity;
		const slipAbs = Math.abs(slipDifference);
		this.longitudinalSlipRatio = slipAbs / Math.max(longitudinalAbs, 1e-4);
		this.lateralSlipRatio =
			lateralAbs === 0 && longitudinalAbs === 0
				? 0
				: THREE.MathUtils.clamp(Math.atan2(lateralAbs, longitudinalAbs) / (Math.PI / 2), 0, 1);
		this.currentSlipStrength = Math.max(this.longitudinalSlipRatio, this.lateralSlipRatio);
		const longitudinalSlip = evaluateCurveLut(this.longitudinalCurve(), this.longitudinalSlipRatio);
		const lateralSlip = evaluateCurveLut(this.lateralCurve(), this.lateralSlipRatio);
		const longitudinalStaticWeight = THREE.MathUtils.clamp(
			1 - Math.max(slipAbs, longitudinalAbs) / options.lowVelThreshold,
			0,
			1,
		);
		const lateralStaticWeight = THREE.MathUtils.clamp(
			1 - Math.max(lateralAbs, longitudinalAbs) / options.lowVelThreshold,
			0,
			1,
		);
		const finalLongitudinalSlip = remap(longitudinalStaticWeight, 0, 1, longitudinalSlip, 1);
		const finalLateralSlip = remap(lateralStaticWeight, 0, 1, lateralSlip, 1);
		const frictionCoefficient = Math.max((this.currentFriction + options.tireGripFactor) * 0.5, 0);
		const maximumLongitudinalImpulse =
			this.supportForceMagnitude *
			finalLongitudinalSlip *
			frictionCoefficient *
			delta *
			options.lngFrictionEllipseScale;
		const maximumLateralImpulse =
			this.supportForceMagnitude *
			finalLateralSlip *
			frictionCoefficient *
			delta *
			options.latFrictionEllipseScale;
		let desiredLongitudinal =
			maximumLongitudinalImpulse > 0
				? (slipDifference * this.effectiveInertia) / Math.max(radiusSquared, 1e-8)
				: 0;
		let desiredLateral =
			maximumLateralImpulse > 0 ? lateralVelocity * (this.supportForceMagnitude / gravityMagnitude) : 0;
		const longitudinalUsage = maximumLongitudinalImpulse > 0 ? desiredLongitudinal / maximumLongitudinalImpulse : 0;
		const lateralUsage = maximumLateralImpulse > 0 ? desiredLateral / maximumLateralImpulse : 0;
		const ellipseUsage = Math.hypot(longitudinalUsage, lateralUsage);
		if (ellipseUsage > 1) {
			desiredLongitudinal /= ellipseUsage;
			desiredLateral /= ellipseUsage;
		}
		const longitudinalCoefficient = THREE.MathUtils.clamp(
			Math.max(options.minLngRelaxCoeff, (longitudinalAbs / Math.max(options.relaxLngRate, 1e-6)) * delta),
			0,
			1,
		);
		const lateralCoefficient = THREE.MathUtils.clamp(
			Math.max(options.minLatRelaxCoeff, (lateralAbs / Math.max(options.relaxLatRate, 1e-6)) * delta),
			0,
			1,
		);
		this.smoothedLongitudinalImpulse +=
			(desiredLongitudinal - this.smoothedLongitudinalImpulse) * longitudinalCoefficient;
		this.smoothedLateralImpulse += (desiredLateral - this.smoothedLateralImpulse) * lateralCoefficient;
		if (maximumLongitudinalImpulse <= 0) this.smoothedLongitudinalImpulse = 0;
		if (maximumLateralImpulse <= 0) this.smoothedLateralImpulse = 0;
		const smoothedEllipseUsage = Math.hypot(
			maximumLongitudinalImpulse > 0 ? this.smoothedLongitudinalImpulse / maximumLongitudinalImpulse : 0,
			maximumLateralImpulse > 0 ? this.smoothedLateralImpulse / maximumLateralImpulse : 0,
		);
		if (smoothedEllipseUsage > 1) {
			this.smoothedLongitudinalImpulse /= smoothedEllipseUsage;
			this.smoothedLateralImpulse /= smoothedEllipseUsage;
		}
		this.vLongitudinalImpulse.copy(this.vLongitudinalAxis).multiplyScalar(this.smoothedLongitudinalImpulse);
		this.vLateralImpulse.copy(this.vLateralAxis).multiplyScalar(-this.smoothedLateralImpulse);
	}

	private applyCounterImpulses(options: Required<NgteShapeCastWheelOptions>, delta: number) {
		if (!this.hitBody || this.hitBody.bodyType() !== 0) return;
		if (options.applyCounterMass && this.supportForceMagnitude > 0) {
			this.vCounterSupportImpulse
				.copy(this.vContactNormal)
				.multiplyScalar(-this.supportForceMagnitude * delta * this.platformMassRatio);
			this.hitBody.applyImpulseAtPoint(
				toRapierVector(this.vCounterSupportImpulse),
				toRapierVector(this.vContactPoint),
				true,
			);
		}
		if (options.applyCounterFriction) {
			this.vCounterFrictionImpulse
				.copy(this.vLongitudinalImpulse)
				.add(this.vLateralImpulse)
				.multiplyScalar(-this.platformMassRatio);
			if (this.vCounterFrictionImpulse.lengthSq() > 1e-4) {
				this.hitBody.applyImpulseAtPoint(
					toRapierVector(this.vCounterFrictionImpulse),
					toRapierVector(this.vContactPoint),
					true,
				);
			}
		}
	}

	private solveWheelRotation(options: Required<NgteShapeCastWheelOptions>, delta: number, hasContact: boolean) {
		const inertia = Math.max(this.effectiveInertia, 1e-8);
		const isDriving = options.driveWheel && Math.abs(this.currentDriveTorque) > 0 && hasContact;
		const isBraking = options.brakeWheel && Math.abs(this.currentBrakeTorque) > 0 && hasContact;
		if (hasContact) {
			this.wheelAngularVelocity -=
				(this.vLongitudinalImpulse.dot(this.vLongitudinalAxis) * options.rayShapeR) / inertia;
		}
		if ((hasContact && !isDriving && !isBraking) || (!hasContact && this.wheelAngularVelocity !== 0)) {
			const resistance = -options.rollingResistanceCoef * this.supportForceMagnitude * this.wheelAngularVelocity;
			this.wheelAngularVelocity += (resistance / inertia) * delta;
		}
		if (isDriving && !isBraking) this.wheelAngularVelocity += (this.currentDriveTorque / inertia) * delta;
		if (isBraking) {
			const applied = this.currentBrakeTorque * -Math.sign(this.wheelAngularVelocity);
			this.wheelAngularVelocity +=
				Math.min(Math.abs(this.wheelAngularVelocity), Math.abs(applied / inertia) * delta) *
				-Math.sign(this.wheelAngularVelocity);
		}
		this.wheelLinearVelocity = this.wheelAngularVelocity * options.rayShapeR;
	}

	private updateWheelModel(options: Required<NgteShapeCastWheelOptions>, delta: number, hasContact: boolean) {
		if (!options.wheelModelUpdate) return;
		const wheel = this.wheelRef()?.nativeElement;
		const model = this.modelRef()?.nativeElement;
		if (!wheel || !model) return;
		const offset = hasContact
			? -(options.rayLength + options.rayShapeR) +
				options.wheelModelRadius +
				(options.rayLength - this.suspensionToi)
			: -(options.rayLength + options.rayShapeR) + options.wheelModelRadius;
		wheel.position.y = THREE.MathUtils.lerp(
			wheel.position.y,
			offset,
			1 - Math.exp(-options.wheelModelLerpPosRate * delta),
		);
		model.rotation.x += this.wheelAngularVelocity * delta * (options.wheelModelReversRotation ? -1 : 1);
	}

	private clearContact() {
		this.shapeHit = null;
		this.rayHitResult = null;
		this.hitBody = null;
		this.suspensionToi = 0;
		this.currentFriction = 0;
		this.onPlatform = false;
		this.platformMassRatio = 1;
		this.supportForceMagnitude = 0;
		this.longitudinalSlipRatio = 0;
		this.lateralSlipRatio = 0;
		this.currentSlipStrength = 0;
		this.vSuspensionImpulse.set(0, 0, 0);
		this.vLongitudinalImpulse.set(0, 0, 0);
		this.vLateralImpulse.set(0, 0, 0);
	}
}
