// import { Injectable, NgZone, inject } from '@angular/core';
// import { WorldService } from './world.service';
//
// @Injectable()
// export class GameService {
// 	private zone = inject(NgZone);
// 	private world = inject(WorldService);
//
// 	status = 'playing';
//
// 	speed = 0;
// 	paused = false;
// 	baseSpeed = 0.00035;
// 	targetBaseSpeed = 0.00035;
// 	speedLastUpdate = 0;
//
// 	distance = 0;
//
// 	coins = 0;
// 	fpv = false;
//
// 	// gun spawning
// 	spawnedSimpleGun = false;
// 	spawnedDoubleGun = false;
// 	spawnedBetterGun = false;
//
// 	lastLifeSpawn = 0;
// 	lifes = this.world.maxLifes;
//
// 	level = 1;
// 	levelLastUpdate = 0;
//
// 	planeFallSpeed = 0.001;
// 	planeSpeed = 0;
// 	planeCollisionDisplacementX = 0;
// 	planeCollisionSpeedX = 0;
// 	planeCollisionDisplacementY = 0;
// 	planeCollisionSpeedY = 0;
//
// 	coinLastSpawn = 0;
// 	enemyLastSpawn = 0;
//
// 	statistics = {
// 		coinsCollected: 0,
// 		coinsSpawned: 0,
// 		enemiesKilled: 0,
// 		enemiesSpawned: 0,
// 		shotsFired: 0,
// 		lifesLost: 0,
// 	};
//
// 	addCoin() {
// 		this.zone.run(() => {
// 			this.coins += 1;
// 			this.statistics.coinsCollected += 1;
// 		});
// 	}
// }
