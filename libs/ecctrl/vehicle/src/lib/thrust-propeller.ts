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
import type { NgtEuler, NgtQuaternion, NgtVector3 } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { NGTE_ECCTRL_VEHICLE_CONTEXT, type NgteEcctrlVehicleContext, type NgtePropellerInfo } from './vehicle-context';

export interface NgteThrustPropellerOptions {
	debug?: boolean;
	enable?: boolean;
	name?: string;
	maxThrust?: number;
	torqueRatio?: number;
	invertThrust?: boolean;
	invertTorque?: boolean;
	showPropellerModel?: boolean;
	propellerModelUpdate?: boolean;
	propellerModelMaxSpin?: number;
	propellerModelLerpSpinRate?: number;
	debuggerScale?: number;
	debuggerArrowScale?: number;
}

export const DEFAULT_ECCTRL_THRUST_PROPELLER_OPTIONS: Required<NgteThrustPropellerOptions> = {
	debug: true,
	enable: true,
	name: '',
	maxThrust: 500,
	torqueRatio: 0.6,
	invertThrust: false,
	invertTorque: false,
	showPropellerModel: true,
	propellerModelUpdate: true,
	propellerModelMaxSpin: 50,
	propellerModelLerpSpinRate: 10,
	debuggerScale: 1,
	debuggerArrowScale: 35,
};

function toRapierVector(value: THREE.Vector3) {
	return { x: value.x, y: value.y, z: value.z };
}

/** One impulse-driven motor module for `NgteEcctrlVehicle`. */
@Component({
	selector: 'ngte-thrust-propeller',
	exportAs: 'thrustPropeller',
	template: `
		<ngt-group
			#propeller
			[position]="position()"
			[rotation]="rotation()"
			[quaternion]="quaternion()"
			[scale]="scale()"
		>
			@if (resolvedOptions().showPropellerModel) {
				<ngt-group #model>
					<ng-content />
				</ngt-group>
			}
			@if (resolvedOptions().debug) {
				<ngt-axes-helper [scale]="resolvedOptions().debuggerScale" />
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteThrustPropeller {
	id = input<string | number>();
	options = input(DEFAULT_ECCTRL_THRUST_PROPELLER_OPTIONS, {
		transform: mergeInputs(DEFAULT_ECCTRL_THRUST_PROPELLER_OPTIONS),
	});
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>();
	quaternion = input<NgtQuaternion>();
	scale = input<NgtVector3>([1, 1, 1]);

	protected readonly resolvedOptions = computed(() => ({
		...DEFAULT_ECCTRL_THRUST_PROPELLER_OPTIONS,
		...this.options(),
	}));
	private readonly context = inject<NgteEcctrlVehicleContext>(NGTE_ECCTRL_VEHICLE_CONTEXT);
	private readonly propellerRef = viewChild<ElementRef<THREE.Group>>('propeller');
	private readonly modelRef = viewChild<ElementRef<THREE.Group>>('model');
	private stableId = THREE.MathUtils.generateUUID();
	private throttle = 0;
	private modelSpinVelocity = 0;

	private readonly vWorldPosition = new THREE.Vector3();
	private readonly qWorldQuaternion = new THREE.Quaternion();
	private readonly qVehicleInverse = new THREE.Quaternion();
	private readonly vLocalPosition = new THREE.Vector3();
	private readonly qLocalQuaternion = new THREE.Quaternion();
	private readonly vThrustDirection = new THREE.Vector3();
	private readonly vThrustPotential = new THREE.Vector3();
	private readonly vLeverageTorque = new THREE.Vector3();
	private readonly vTorqueDirection = new THREE.Vector3();
	private readonly vReactionTorque = new THREE.Vector3();
	private readonly vTorquePotential = new THREE.Vector3();
	private readonly vWorldThrustPosition = new THREE.Vector3();
	private readonly vWorldThrustDirection = new THREE.Vector3();
	private readonly vWorldTorqueDirection = new THREE.Vector3();
	private readonly vThrustImpulse = new THREE.Vector3();
	private readonly vTorqueImpulse = new THREE.Vector3();
	private potential = { lx: 0, ly: 0, lz: 0, ax: 0, ay: 0, az: 0 };

	readonly info: NgtePropellerInfo;

	constructor() {
		const propeller = this;
		this.info = {
			get id() {
				return propeller.stableId;
			},
			get maxThrust() {
				return propeller.resolvedOptions().maxThrust;
			},
			get torqueRatio() {
				return propeller.resolvedOptions().torqueRatio;
			},
			get invertThrust() {
				return propeller.resolvedOptions().invertThrust;
			},
			get invertTorque() {
				return propeller.resolvedOptions().invertTorque;
			},
			get currentThrottle() {
				return propeller.throttle;
			},
			get finalThrottle() {
				return propeller.throttle;
			},
			get worldPosition() {
				return propeller.vWorldPosition;
			},
			get worldQuaternion() {
				return propeller.qWorldQuaternion;
			},
			get thrustPos() {
				return propeller.vLocalPosition;
			},
			get thrustDir() {
				return propeller.vThrustDirection;
			},
			get thrustPot() {
				return propeller.vThrustPotential;
			},
			get torqueDir() {
				return propeller.vTorqueDirection;
			},
			get torquePot() {
				return propeller.vTorquePotential;
			},
			get worldThrustPos() {
				return propeller.vWorldThrustPosition;
			},
			get worldThrustDir() {
				return propeller.vWorldThrustDirection;
			},
			get worldTorqueDir() {
				return propeller.vWorldTorqueDirection;
			},
			get thrustImpulse() {
				return propeller.vThrustImpulse;
			},
			get torqueImpulse() {
				return propeller.vTorqueImpulse;
			},
			get lx() {
				return propeller.potential.lx;
			},
			get ly() {
				return propeller.potential.ly;
			},
			get lz() {
				return propeller.potential.lz;
			},
			get ax() {
				return propeller.potential.ax;
			},
			get ay() {
				return propeller.potential.ay;
			},
			get az() {
				return propeller.potential.az;
			},
			prepare(delta) {
				propeller.prepare(delta);
			},
			setThrottle(throttle) {
				propeller.setThrottle(throttle);
			},
			apply(delta) {
				propeller.apply(delta);
			},
		};

		effect((onCleanup) => {
			const explicitId = untracked(this.id);
			if (explicitId !== undefined) this.stableId = String(explicitId);
			this.context.registerPropeller(this.info);
			onCleanup(() => this.context.unregisterPropeller(this.stableId));
		});
	}

	private prepare(delta: number) {
		const options = this.resolvedOptions();
		const root = this.propellerRef()?.nativeElement;
		const body = this.context.state.body;
		if (!root || !body || !options.enable) {
			this.potential = { lx: 0, ly: 0, lz: 0, ax: 0, ay: 0, az: 0 };
			return;
		}

		root.getWorldPosition(this.vWorldPosition);
		root.getWorldQuaternion(this.qWorldQuaternion);
		this.qVehicleInverse.copy(this.context.state.currQuat).invert();
		this.vLocalPosition
			.copy(this.vWorldPosition)
			.sub(this.context.state.currPos)
			.applyQuaternion(this.qVehicleInverse);
		this.qLocalQuaternion.multiplyQuaternions(this.qVehicleInverse, this.qWorldQuaternion);
		this.vThrustDirection.set(0, options.invertThrust ? -1 : 1, 0).applyQuaternion(this.qLocalQuaternion);
		this.vThrustPotential.copy(this.vThrustDirection).multiplyScalar(options.maxThrust);
		this.vLeverageTorque.crossVectors(this.vLocalPosition, this.vThrustPotential);
		this.vTorqueDirection.set(0, options.invertTorque ? -1 : 1, 0).applyQuaternion(this.qLocalQuaternion);
		this.vReactionTorque.copy(this.vTorqueDirection).multiplyScalar(options.maxThrust * options.torqueRatio);
		this.vTorquePotential.copy(this.vLeverageTorque).add(this.vReactionTorque);
		this.potential = {
			lx: this.vThrustPotential.x,
			ly: this.vThrustPotential.y,
			lz: this.vThrustPotential.z,
			ax: this.vTorquePotential.x,
			ay: this.vTorquePotential.y,
			az: this.vTorquePotential.z,
		};

		if (options.propellerModelUpdate) {
			const model = this.modelRef()?.nativeElement;
			if (model) {
				const target = this.throttle * options.propellerModelMaxSpin * (options.invertTorque ? -1 : 1);
				this.modelSpinVelocity = THREE.MathUtils.lerp(
					this.modelSpinVelocity,
					target,
					1 - Math.exp(-options.propellerModelLerpSpinRate * delta),
				);
				model.rotateY(this.modelSpinVelocity * 60 * delta);
			}
		}
	}

	private setThrottle(value: number) {
		this.throttle = THREE.MathUtils.clamp(value, 0, 1);
	}

	private apply(delta: number) {
		const body = this.context.state.body;
		const options = this.resolvedOptions();
		if (!body || !options.enable || !Number.isFinite(delta) || delta <= 0) return;
		this.vWorldThrustDirection.copy(this.vThrustDirection).applyQuaternion(this.context.state.currQuat).normalize();
		this.vWorldThrustPosition
			.copy(this.vLocalPosition)
			.applyQuaternion(this.context.state.currQuat)
			.add(this.context.state.currPos);
		this.vWorldTorqueDirection.copy(this.vTorqueDirection).applyQuaternion(this.context.state.currQuat).normalize();
		this.vThrustImpulse.copy(this.vWorldThrustDirection).multiplyScalar(options.maxThrust * this.throttle * delta);
		this.vTorqueImpulse
			.copy(this.vWorldTorqueDirection)
			.multiplyScalar(options.maxThrust * this.throttle * delta * options.torqueRatio);
		body.applyImpulseAtPoint(toRapierVector(this.vThrustImpulse), toRapierVector(this.vWorldThrustPosition), false);
		body.applyTorqueImpulse(toRapierVector(this.vTorqueImpulse), false);
	}
}
