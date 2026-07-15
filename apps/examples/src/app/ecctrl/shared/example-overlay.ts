import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgteEcctrlJoystick, NgteEcctrlVirtualButton } from 'angular-three-ecctrl/input';
import { TweakpanePane } from 'angular-three-tweakpane';
import { TweakpaneCurve } from 'angular-three-tweakpane/curve';
import { EcctrlExampleControls } from './example-controls';

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

		@if (controls.curveActive()) {
			<tweakpane-pane title="Mass ratio curve" top="40px" width="300px">
				<tweakpane-curve
					label="Counter impulse"
					[value]="controls.curve()"
					(valueChange)="controls.curve.set($event)"
				/>
			</tweakpane-pane>
		}
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
	`,
	imports: [NgteEcctrlJoystick, NgteEcctrlVirtualButton, TweakpaneCurve, TweakpanePane],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcctrlExampleOverlay {
	readonly description = input.required<string>();
	protected readonly controls = inject(EcctrlExampleControls);
}
