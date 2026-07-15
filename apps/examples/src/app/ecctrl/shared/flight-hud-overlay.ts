import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EcctrlExampleControls } from './example-controls';

@Component({
	selector: 'app-ecctrl-flight-hud-overlay',
	template: `
		@if (controls.flightHudLayout(); as hud) {
			@let telemetry = controls.flightTelemetry();
			<section
				class="hud"
				aria-label="Drone forward camera telemetry"
				[style.height.px]="hud.height"
				[style.right.px]="hud.right"
				[style.top.px]="hud.top"
				[style.width.px]="hud.width"
			>
				<div class="bar top">
					<span class="live">
						<i></i>
						LIVE · FPV
					</span>
					<span>{{ telemetry.heading.toString().padStart(3, '0') }}°</span>
				</div>

				<div
					class="horizon"
					[style.transform]="
						'translate(-50%, calc(-50% + ' +
						telemetry.pitch * 1.1 +
						'px)) rotate(' +
						-telemetry.roll +
						'deg)'
					"
				>
					<i></i>
					<i></i>
					<i></i>
				</div>
				<div class="reticle"></div>

				<div class="telemetry left">
					<small>SPD</small>
					<strong>{{ telemetry.speed.toFixed(1) }}</strong>
					<span>m/s</span>
				</div>
				<div class="telemetry right">
					<small>ALT</small>
					<strong>{{ telemetry.altitude.toFixed(1) }}</strong>
					<span>m AGL</span>
				</div>
				<div class="bar footer">
					<span>
						VS {{ telemetry.verticalSpeed >= 0 ? '+' : '' }}{{ telemetry.verticalSpeed.toFixed(1) }}
					</span>
					<span>P {{ telemetry.pitch.toFixed(0) }}°</span>
					<span>R {{ telemetry.roll.toFixed(0) }}°</span>
					<span>LINK 100</span>
				</div>
			</section>
		}
	`,
	styles: `
		:host {
			inset: 0;
			pointer-events: none;
			position: absolute;
		}

		.hud {
			border: 1px solid rgb(103 232 249 / 75%);
			box-shadow:
				0 0 0 5px rgb(2 6 23 / 72%),
				0 16px 40px rgb(2 6 23 / 48%);
			color: #cffafe;
			font:
				600 11px/1 ui-monospace,
				SFMono-Regular,
				Menlo,
				monospace;
			overflow: hidden;
			position: absolute;
			text-shadow: 0 1px 4px #020617;
		}

		.hud::after {
			background: repeating-linear-gradient(0deg, transparent 0 3px, rgb(15 23 42 / 6%) 3px 4px);
			content: '';
			inset: 0;
			position: absolute;
		}

		.bar {
			align-items: center;
			background: rgb(2 6 23 / 60%);
			display: flex;
			justify-content: space-between;
			left: 0;
			padding: 7px 12px;
			position: absolute;
			right: 0;
			z-index: 2;
		}

		.top {
			top: 0;
		}
		.footer {
			bottom: 0;
			font-size: 9px;
			gap: 10px;
		}
		.live {
			align-items: center;
			display: flex;
			gap: 6px;
		}
		.live i {
			background: #fb7185;
			border-radius: 50%;
			box-shadow: 0 0 8px #fb7185;
			height: 6px;
			width: 6px;
		}

		.horizon,
		.reticle {
			left: 50%;
			position: absolute;
			top: 50%;
			z-index: 2;
		}
		.horizon {
			align-items: center;
			display: flex;
			gap: 9px;
			transform-origin: center;
		}
		.horizon i {
			background: rgb(207 250 254 / 78%);
			height: 1px;
			width: 44px;
		}
		.horizon i:nth-child(2) {
			height: 5px;
			transform: rotate(45deg);
			width: 5px;
		}

		.reticle {
			border: 1px solid #cffafe;
			border-radius: 50%;
			height: 17px;
			transform: translate(-50%, -50%);
			width: 17px;
		}
		.reticle::before,
		.reticle::after {
			background: #cffafe;
			content: '';
			position: absolute;
		}
		.reticle::before {
			height: 1px;
			left: -9px;
			top: 8px;
			width: 35px;
		}
		.reticle::after {
			height: 35px;
			left: 8px;
			top: -9px;
			width: 1px;
		}

		.telemetry {
			background: rgb(2 6 23 / 58%);
			display: grid;
			gap: 2px;
			padding: 7px 8px;
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			z-index: 2;
		}
		.left {
			left: 8px;
		}
		.right {
			right: 8px;
			text-align: right;
		}
		.telemetry small,
		.telemetry span {
			color: #a5f3fc;
			font-size: 8px;
		}
		.telemetry strong {
			font-size: 15px;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcctrlFlightHudOverlay {
	protected readonly controls = inject(EcctrlExampleControls);
}
