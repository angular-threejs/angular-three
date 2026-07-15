import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgteEcctrlJoystick, NgteEcctrlVirtualButton } from 'angular-three-ecctrl/input';
import { TweakpanePane } from 'angular-three-tweakpane';
import { TweakpaneCurve } from 'angular-three-tweakpane/curve';
import { EcctrlExampleControls } from './example-controls';
import { EcctrlFlightHudOverlay } from './flight-hud-overlay';

@Component({
	selector: 'app-ecctrl-example-overlay',
	template: `
		@if (description(); as description) {
			<div class="ecctrl-example-info">
				<p class="ecctrl-description">{{ description }}</p>
				@if (!controls.touchActive() && controls.instructions(); as instructions) {
					<p class="ecctrl-instructions">{{ instructions }}</p>
				}
			</div>
		}

		@if (controls.touchActive()) {
			<div class="ecctrl-touch-controls" aria-label="Touch character controls">
				<ngte-ecctrl-joystick [value]="controls.joystick()" (valueChange)="controls.joystick.set($event)" />
				<div class="ecctrl-touch-actions">
					<ngte-ecctrl-virtual-button
						ariaLabel="Run"
						[pressed]="controls.run()"
						(pressedChange)="controls.run.set($event)"
					>
						Run
					</ngte-ecctrl-virtual-button>
					<ngte-ecctrl-virtual-button
						ariaLabel="Jump"
						[pressed]="controls.jump()"
						(pressedChange)="controls.jump.set($event)"
					>
						Jump
					</ngte-ecctrl-virtual-button>
				</div>
			</div>
		}

		@if (controls.flightControlsActive()) {
			<div class="ecctrl-flight-touch-controls" aria-label="Touch drone controls">
				<div class="ecctrl-flight-stick">
					<ngte-ecctrl-joystick
						ariaLabel="Drone altitude and yaw"
						[deadzone]="0.08"
						[size]="92"
						[value]="controls.flightJoystickLeft()"
						(valueChange)="controls.flightJoystickLeft.set($event)"
					/>
					<span>ALT · YAW</span>
				</div>
				<div class="ecctrl-flight-stick">
					<ngte-ecctrl-joystick
						ariaLabel="Drone pitch and roll"
						[deadzone]="0.08"
						[size]="92"
						[value]="controls.flightJoystickRight()"
						(valueChange)="controls.flightJoystickRight.set($event)"
					/>
					<span>PITCH · ROLL</span>
				</div>
			</div>
		}

		@if (controls.curveActive()) {
			<tweakpane-pane title="Mass ratio curve" top="40px" width="300px">
				<tweakpane-curve
					label="Counter impulse"
					[value]="controls.curve()"
					(valueChange)="controls.curve.set($event)"
				/>
			</tweakpane-pane>
		}

		<app-ecctrl-flight-hud-overlay />
	`,
	styles: `
		:host {
			inset: 0;
			pointer-events: none;
			position: absolute;
			z-index: 4;
		}

		.ecctrl-touch-controls {
			align-items: end;
			bottom: max(76px, calc(env(safe-area-inset-bottom) + 76px));
			display: flex;
			gap: 20px;
			justify-content: flex-end;
			left: max(20px, env(safe-area-inset-left));
			position: absolute;
			right: max(20px, env(safe-area-inset-right));
		}

		.ecctrl-flight-touch-controls {
			align-items: end;
			bottom: max(132px, calc(env(safe-area-inset-bottom) + 112px));
			display: none;
			justify-content: space-between;
			left: max(14px, env(safe-area-inset-left));
			pointer-events: none;
			position: absolute;
			right: max(14px, env(safe-area-inset-right));
		}

		.ecctrl-flight-stick {
			align-items: center;
			color: rgb(207 250 254 / 82%);
			display: flex;
			flex-direction: column;
			font:
				600 9px/1 ui-monospace,
				SFMono-Regular,
				Menlo,
				monospace;
			gap: 7px;
			letter-spacing: 0.08em;
			pointer-events: auto;
			text-shadow: 0 1px 4px #020617;
		}

		.ecctrl-example-info {
			background: rgb(15 23 42 / 78%);
			border: 1px solid rgb(148 163 184 / 28%);
			border-radius: 8px;
			color: #e2e8f0;
			left: 16px;
			max-width: min(520px, calc(100% - 32px));
			padding: 8px 10px;
			position: absolute;
			top: 16px;
		}

		.ecctrl-description,
		.ecctrl-instructions {
			margin: 0;
		}

		.ecctrl-description {
			font:
				500 13px/1.4 system-ui,
				sans-serif;
		}

		.ecctrl-instructions {
			border-top: 1px solid rgb(148 163 184 / 20%);
			color: #cbd5e1;
			font:
				500 12px/1.35 ui-monospace,
				SFMono-Regular,
				Menlo,
				monospace;
			margin-top: 7px;
			padding-top: 7px;
		}

		.ecctrl-touch-controls > *,
		.ecctrl-touch-actions,
		tweakpane-pane {
			pointer-events: auto;
		}

		.ecctrl-touch-actions {
			display: flex;
			gap: 12px;
		}

		@media (hover: none), (pointer: coarse), (max-width: 760px) {
			.ecctrl-flight-touch-controls {
				display: flex;
			}
		}

		@media (max-height: 520px) and (orientation: landscape) {
			:host(.ecctrl-flight-active) .ecctrl-example-info {
				max-width: min(46%, 340px);
			}

			:host(.ecctrl-flight-active) .ecctrl-instructions {
				display: none;
			}
		}
	`,
	imports: [EcctrlFlightHudOverlay, NgteEcctrlJoystick, NgteEcctrlVirtualButton, TweakpaneCurve, TweakpanePane],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { '[class.ecctrl-flight-active]': 'controls.flightControlsActive()' },
})
export class EcctrlExampleOverlay {
	readonly description = input.required<string>();
	protected readonly controls = inject(EcctrlExampleControls);
}
