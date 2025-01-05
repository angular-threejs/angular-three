import { Directive, inject, Injectable, model, signal, untracked, WritableSignal } from '@angular/core';
import { PLANE_AMP_HEIGHT, PLANE_DEFAULT_HEIGHT, SEA_RADIUS } from '../constants';
import { GameStore } from '../game.store';
import { Spawnable } from '../spawnable/spawnables.store';

export const POWER_UP_TYPES = ['armor', 'magnet', 'doubleCoin'] as const;
export type PowerUpType = (typeof POWER_UP_TYPES)[number];

export type CollectibleState = 'spawned' | 'collected' | 'skipped';
export interface CollectibleItem {
	state: WritableSignal<CollectibleState>;
	angle: number;
	distance: number;
	positionY: number;
	positionX: number;
}

export interface CollectibleCoin extends CollectibleItem {
	key: number;
}

export interface CollectiblePowerUp extends CollectibleItem {
	type: PowerUpType;
	key: string;
}

@Directive({
	hostDirectives: [{ directive: Spawnable, inputs: ['initialAngle', 'initialDistance', 'positionX', 'positionY'] }],
})
export class Collectible {
	state = model.required<CollectibleState>();

	private spawnable = inject(Spawnable, { host: true });

	constructor() {
		this.spawnable.onCollide(() => this.state.set('collected'));
		this.spawnable.onSkip(() => this.state.set('skipped'));
	}
}

@Injectable()
export class CollectiblesStore {
	private gameStore = inject(GameStore);

	coins = signal<Array<CollectibleCoin>>([]);
	powerUps = signal<Array<CollectiblePowerUp>>([]);

	state = {
		lastPowerUpSpawnedAt: 0,
	};

	spawnCoins() {
		const nCoins = 1 + Math.floor(Math.random() * 10);
		const d = SEA_RADIUS + PLANE_DEFAULT_HEIGHT + this.randomFromRange(-1, 1) * (PLANE_AMP_HEIGHT - 20);
		const amplitude = 10 + Math.round(Math.random() * 10);

		this.coins.update((prev) => [
			// NOTE: we filter out all the coins that are already collected or skipped
			...prev.filter((coin) => untracked(coin.state) === 'spawned'),
			...Array.from({ length: nCoins }).map((_, index) => {
				const angle = -(index * 0.02);
				const distance = d + Math.cos(index * 0.5) * amplitude;

				return {
					key: this.gameStore.statistics.coinsSpawned + index,
					state: signal<CollectibleState>('spawned'),
					angle,
					distance,
					positionY: -SEA_RADIUS + Math.sin(angle) * distance,
					positionX: Math.cos(angle) * distance,
				};
			}),
		]);
		this.gameStore.statistics.coinsSpawned += nCoins;
	}

	spawnPowerUps() {
		const type = POWER_UP_TYPES[Math.floor(Math.random() * 3)];

		this.powerUps.update((prev) => [
			...prev.filter((powerUp) => untracked(powerUp.state) === 'spawned'),
			{
				key: this.gameStore.statistics.powerUpsSpawned + type,
				type,
				state: signal<CollectibleState>('spawned'),
				angle: 0,
				distance: 1,
				positionY: -SEA_RADIUS,
				positionX: SEA_RADIUS + PLANE_DEFAULT_HEIGHT,
			},
		]);
		this.gameStore.statistics.powerUpsSpawned += 1;
		this.state.lastPowerUpSpawnedAt = this.gameStore.statistics.coinsCollected;
	}

	private randomFromRange(min: number, max: number) {
		return min + Math.random() * (max - min);
	}
}
