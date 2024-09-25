import { DestroyRef, ElementRef, inject, Injectable, Signal, signal } from '@angular/core';
import { Object3D } from 'three';
import type { PowerUpType } from './collectible/collectibles.store';

@Injectable()
export class GameStore {
	coins = signal(0);
	health = signal(3);

	magnet = signal(0);
	doubleCoin = signal(0);
	armor = signal(0);

	private intervals: Record<string, ReturnType<typeof setInterval> | undefined> = {
		doubleCoin: undefined,
		magnet: undefined,
		armor: undefined,
	};

	airplaneRef?: Signal<ElementRef<Object3D>>;

	// NOTE: these aren't signals because they are game state used in the animation loop.
	state = {
		status: 'playing',

		speed: 0,
		planeSpeed: 0,
		baseSpeed: 0.00035,
		targetBaseSpeed: 0.00035,

		distance: 0,

		planeCollisionDisplacementX: 0,
		planeCollisionSpeedX: 0,
		planeCollisionDisplacementY: 0,
		planeCollisionSpeedY: 0,

		coinLastSpawn: 0,
	};

	statistics = {
		coinsCollected: 0,
		coinsSpawned: 0,
		powerUpsSpawned: 0,
		powerUpsCollected: 0,
	};

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			for (const interval of Object.values(this.intervals)) {
				if (interval) clearInterval(interval);
			}
		});
	}

	incrementCoin() {
		this.statistics.coinsCollected += 1;
		this.coins.update((prev) => prev + (this.doubleCoin() ? 2 : 1));
	}

	acquirePowerUp(type: PowerUpType) {
		const interval = this.intervals[type];
		if (interval) clearInterval(interval);

		this[type].set(10);

		this.intervals[type] = setInterval(() => {
			this[type].update((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					this.intervals[type] = undefined;
					return 0;
				}

				return prev - 1;
			});
		}, 1000);
	}
}
