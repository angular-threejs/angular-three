import { ElementRef, Injectable, Signal, signal } from '@angular/core';
import { Object3D } from 'three';

@Injectable()
export class GameStore {
	coins = signal(0);
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
	};

	incrementCoin() {
		this.statistics.coinsCollected += 1;
		this.coins.update((prev) => prev + 1);
	}
}
