import { afterNextRender, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { injectBeforeRender, injectStore, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Euler } from 'three';
import { Airplane } from './airplane/airplane';
import { Coin } from './collectible/coin';
import { CollectiblesStore } from './collectible/collectibles.store';
import { DISTANCE_FOR_COINS_SPAWN, PLANE_DEFAULT_HEIGHT, RATIO_SPEED_DISTANCE } from './constants';
import { GameStore } from './game.store';
import { Lights } from './lights/lights';
import { Sea } from './sea/sea';
import { Sky } from './sky/sky';

@Component({
	standalone: true,
	template: `
		<ngt-fog *args="['#f7d9aa', 100, 950]" attach="fog" />

		<app-lights />
		<app-airplane />
		<app-sea />
		<app-sea isStatic />
		<app-sky />

		@for (coin of coins(); track coin.key) {
			@if (coin.state() === 'spawned') {
				<app-coin
					[(state)]="coin.state"
					[initialAngle]="coin.angle"
					[initialDistance]="coin.distance"
					[positionX]="coin.positionX"
					[positionY]="coin.positionY"
				/>
			}
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, Lights, Sea, NgtsOrbitControls, Sky, Airplane, Coin],
})
export class Experience {
	private gameStore = inject(GameStore);
	private collectiblesStore = inject(CollectiblesStore);

	protected coins = this.collectiblesStore.coins.asReadonly();

	constructor() {
		const store = injectStore();
		const camera = store.select('camera');

		afterNextRender(() => {
			const _camera = camera();
			_camera.position.set(0, PLANE_DEFAULT_HEIGHT, 200);
			_camera.setRotationFromEuler(new Euler(0, 0, 0));
			_camera.updateProjectionMatrix();
		});

		injectBeforeRender(({ delta }) => {
			this.gameStore.state.distance += this.gameStore.state.speed * delta * 1_000 * RATIO_SPEED_DISTANCE;
			this.gameStore.state.baseSpeed +=
				(this.gameStore.state.targetBaseSpeed - this.gameStore.state.baseSpeed) * delta * 1_000 * 0.02;
			this.gameStore.state.speed = this.gameStore.state.baseSpeed * this.gameStore.state.planeSpeed;

			if (
				Math.floor(this.gameStore.state.distance) % DISTANCE_FOR_COINS_SPAWN == 1 &&
				Math.floor(this.gameStore.state.distance) > this.gameStore.state.coinLastSpawn
			) {
				this.gameStore.state.coinLastSpawn = Math.floor(this.gameStore.state.distance);
				this.collectiblesStore.spawnCoins();
			}
		});
	}
}
