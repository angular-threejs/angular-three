import { Injectable, signal } from '@angular/core';
import type { NgteEcctrlJoystickValue } from 'angular-three-ecctrl/input';
import type { NgtsCameraControls } from 'angular-three-soba/controls';
import type { TweakpaneCurveData } from 'angular-three-tweakpane/curve';
import { Vector3 } from 'three';

type CameraControls = ReturnType<NgtsCameraControls['controls']>;

const DEFAULT_INSTRUCTIONS = 'Character · W/S move · A/D turn · Shift run · Space jump · drag to orbit · wheel to zoom';

export interface EcctrlFlightHudLayout {
	width: number;
	height: number;
	top: number;
	right: number;
}

export interface EcctrlFlightTelemetry {
	altitude: number;
	heading: number;
	pitch: number;
	roll: number;
	speed: number;
	verticalSpeed: number;
}

const DEFAULT_FLIGHT_TELEMETRY: EcctrlFlightTelemetry = {
	altitude: 0,
	heading: 0,
	pitch: 0,
	roll: 0,
	speed: 0,
	verticalSpeed: 0,
};

@Injectable()
export class EcctrlExampleControls {
	private readonly cameraTarget = new Vector3();
	private hasCameraTarget = false;

	readonly instructions = signal<string | null>(DEFAULT_INSTRUCTIONS);
	readonly touchActive = signal(false);
	readonly joystick = signal<NgteEcctrlJoystickValue>({ x: 0, y: 0 });
	readonly jump = signal(false);
	readonly run = signal(false);
	readonly physicsPaused = signal(false);
	readonly physicsTimeStep = signal<number | 'vary'>(1 / 60);
	readonly physicsGravity = signal<[number, number, number]>([0, -9.81, 0]);
	readonly curveActive = signal(false);
	readonly flightHudLayout = signal<EcctrlFlightHudLayout | null>(null);
	readonly flightTelemetry = signal<EcctrlFlightTelemetry>(DEFAULT_FLIGHT_TELEMETRY);
	readonly curve = signal<TweakpaneCurveData>({
		points: [
			{ x: 0, y: 0, r_out: 0 },
			{ x: 0.5, y: 0, r_in: 0, r_out: 0 },
			{ x: 1, y: 1, r_in: 0 },
		],
		samples: 50,
	});

	setInstructions(instructions: string) {
		this.instructions.set(instructions);
		return () => {
			if (this.instructions() === instructions) this.instructions.set(DEFAULT_INSTRUCTIONS);
		};
	}

	resetTouch() {
		this.joystick.set({ x: 0, y: 0 });
		this.jump.set(false);
		this.run.set(false);
		this.touchActive.set(false);
	}

	resetFlightHud() {
		this.flightHudLayout.set(null);
		this.flightTelemetry.set(DEFAULT_FLIGHT_TELEMETRY);
	}

	restoreCameraTarget(controls: CameraControls) {
		if (!this.hasCameraTarget) return;
		void controls.setTarget(this.cameraTarget.x, this.cameraTarget.y, this.cameraTarget.z, false);
		controls.update(0);
	}

	captureCameraTarget(controls: CameraControls) {
		controls.getTarget(this.cameraTarget, false);
		this.hasCameraTarget = true;
	}
}
