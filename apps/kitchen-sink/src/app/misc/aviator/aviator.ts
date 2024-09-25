import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { CollectiblesStore, POWER_UP_TYPES } from './collectible/collectibles.store';
import { Experience } from './experience';
import { GameStore } from './game.store';
import { CoinOverlay } from './overlays/coin-overlay';
import { HealthOverlay } from './overlays/health-overlay';
import { PowerUpsOverlay } from './overlays/power-ups-overlay';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ fov: 50, near: 0.1, far: 10000 }" [shadows]="true" />
		<div class="absolute top-4 right-1/2 translate-x-1/2 flex gap-4 items-center">
			<app-health-overlay />
			<div class="w-0.5 h-4 bg-white"></div>
			<app-coin-overlay />
			<div class="w-0.5 h-4 bg-white"></div>
			<app-power-ups-overlay />
			<!--			<button (click)="onTestPowerUp()" class="text-white font-mono">Test powerup</button>-->
			<!--			<button (click)="onTestHealth()" class="text-white font-mono">Test health</button>-->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, CoinOverlay, HealthOverlay, PowerUpsOverlay],
	providers: [GameStore, CollectiblesStore],
	styles: `
		:host {
			display: block;
			height: 100%;
			width: 100%;
			background: linear-gradient(#101232, #101560);
		}
	`,
})
export default class Aviator {
	protected sceneGraph = Experience;
	protected gameStore = inject(GameStore);

	onTestPowerUp() {
		const random = POWER_UP_TYPES[Math.floor(Math.random() * 3)];
		this.gameStore.acquirePowerUp(random);
	}

	onTestHealth() {
		this.gameStore.health.update((prev) => prev - 1);
	}
}
