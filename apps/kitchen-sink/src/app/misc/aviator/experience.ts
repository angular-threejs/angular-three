import { afterNextRender, ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { injectBeforeRender, injectStore, NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Euler } from 'three';
import { Airplane } from './airplane/airplane';
import { CollectibleCoin } from './collectible/collectible-coin.component';
import { CollectiblePowerUp } from './collectible/collectible-power-up.component';
import { CollectiblesStore } from './collectible/collectibles.store';
import { DISTANCE_FOR_COINS_SPAWN, PLANE_DEFAULT_HEIGHT, RATIO_SPEED_DISTANCE, SEA_RADIUS } from './constants';
import { GameStore } from './game.store';
import { Lights } from './lights/lights';
import { Sea } from './sea/sea';
import { Sky } from './sky/sky';

@Component({
    template: `
		<ngt-fog *args="['#f7d9aa', 100, 950]" attach="fog" />

		<app-lights />
		<app-airplane />
		<!--		<app-sea />-->
		<!--		<app-sea isStatic />-->
		<app-sky />

		@for (coin of coins(); track coin.key) {
			@if (coin.state() === 'spawned') {
				<app-collectible-coin
					[(state)]="coin.state"
					[initialAngle]="coin.angle"
					[initialDistance]="coin.distance"
					[positionX]="coin.positionX"
					[positionY]="coin.positionY"
				/>
			}
		}

		<!--		<app-collectible-power-up-->
		<!--			[state]="'spawned'"-->
		<!--			powerUp="armor"-->
		<!--			[initialAngle]="-Math.PI / 2"-->
		<!--			[initialDistance]="0"-->
		<!--			[positionY]="-SEA_RADIUS"-->
		<!--			[positionX]="SEA_RADIUS + PLANE_DEFAULT_HEIGHT"-->
		<!--		/>-->

		@for (powerUp of powerUps(); track powerUp.key) {
			@if (powerUp.state() === 'spawned') {
				<app-collectible-power-up
					[(state)]="powerUp.state"
					[powerUp]="powerUp.type"
					[positionX]="powerUp.positionX"
					[positionY]="powerUp.positionY"
					[initialAngle]="powerUp.angle"
					[initialDistance]="powerUp.distance"
				/>
			}
		}

		<ngts-orbit-controls />
	`,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgtArgs, Lights, Sea, NgtsOrbitControls, Sky, Airplane, CollectibleCoin, CollectiblePowerUp]
})
export class Experience {
	private gameStore = inject(GameStore);
	private collectiblesStore = inject(CollectiblesStore);

	protected coins = this.collectiblesStore.coins.asReadonly();
	protected powerUps = this.collectiblesStore.powerUps.asReadonly();

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

			if (
				this.gameStore.statistics.coinsCollected > this.collectiblesStore.state.lastPowerUpSpawnedAt &&
				this.gameStore.statistics.coinsCollected % 25 === 0
			) {
				this.collectiblesStore.spawnPowerUps();
			}
		});
	}

	protected readonly SEA_RADIUS = SEA_RADIUS;
	protected readonly PLANE_DEFAULT_HEIGHT = PLANE_DEFAULT_HEIGHT;
	protected readonly Math = Math;
}
