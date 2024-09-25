import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { POWER_UP_TYPES, PowerUpType } from '../collectible/collectibles.store';
import { GameStore } from '../game.store';

@Component({
	selector: 'app-power-up',
	standalone: true,
	template: `
		<div
			class="absolute inset-x-0 bottom-0 bg-yellow-300 transition-all duration-1000 ease-linear"
			[style.top]="((10 - powerUpValue()) / 10) * 100 + '%'"
			style="height: 100%;"
		></div>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
		>
			@switch (powerUp()) {
				@case ('doubleCoin') {
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
				}
				@case ('armor') {
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25"
					/>
				}
				@case ('magnet') {
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
					/>
				}
			}
		</svg>
	`,
	host: {
		class: 'block relative w-8 h-8 bg-white rounded-full overflow-hidden border border-white border-dashed',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerUp {
	powerUp = input.required<PowerUpType>();
	private gameStore = inject(GameStore);

	protected powerUpValue = computed(() => {
		return this.gameStore[this.powerUp()]();
	});
}

@Component({
	selector: 'app-power-ups-overlay',
	standalone: true,
	template: `
		@for (powerUp of powerUps; track powerUp) {
			<app-power-up [powerUp]="powerUp" />
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'flex gap-2 items-center' },
	imports: [PowerUp],
})
export class PowerUpsOverlay {
	protected powerUps = POWER_UP_TYPES;
}
