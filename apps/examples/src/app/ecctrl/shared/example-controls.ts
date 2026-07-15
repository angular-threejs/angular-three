import { Injectable, signal } from '@angular/core';
import type { NgteEcctrlJoystickValue } from 'angular-three-ecctrl/input';
import type { TweakpaneCurveData } from 'angular-three-tweakpane/curve';

const DEFAULT_INSTRUCTIONS = 'Character · W/S move · A/D turn · Shift run · Space jump · drag to orbit · wheel to zoom';

@Injectable()
export class EcctrlExampleControls {
	readonly instructions = signal<string | null>(DEFAULT_INSTRUCTIONS);
	readonly touchActive = signal(false);
	readonly joystick = signal<NgteEcctrlJoystickValue>({ x: 0, y: 0 });
	readonly jump = signal(false);
	readonly run = signal(false);
	readonly physicsPaused = signal(false);
	readonly physicsTimeStep = signal<number | 'vary'>(1 / 60);
	readonly physicsGravity = signal<[number, number, number]>([0, -9.81, 0]);
	readonly curveActive = signal(false);
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
}
