// import { Injectable, inject } from '@angular/core';
// import { injectNgtStore } from 'angular-three-old';
// import { Coin, type Collectible } from '../utils/collectibles';
// import { randomFromRange } from '../utils/random-from-range';
// import { GameService } from './game.service';
// import { RefsService } from './refs.service';
// import { WorldService } from './world.service';
//
// @Injectable()
// export class CollectibleService {
// 	private store = injectNgtStore();
// 	private scene = this.store.select('scene');
//
// 	private world = inject(WorldService);
// 	private game = inject(GameService);
// 	private refs = inject(RefsService);
//
// 	collectibles = new Set<Collectible>();
//
// 	add(collectible: Collectible) {
// 		this.collectibles.add(collectible);
// 		this.scene().add(collectible);
// 	}
//
// 	remove(collectible: Collectible) {
// 		this.collectibles.delete(collectible);
// 		this.scene().remove(collectible);
// 	}
//
// 	tick(deltaTime: number) {
// 		this.collectibles.forEach((collectible) => {
// 			collectible.tick(deltaTime);
// 		});
// 	}
//
// 	spawnCoins() {
// 		const nCoins = 1 + Math.floor(Math.random() * 10);
// 		const d =
// 			this.world.seaRadius + this.world.planeDefaultHeight + randomFromRange(-1, 1) * (this.world.planeAmpHeight - 20);
// 		const amplitude = 10 + Math.round(Math.random() * 10);
// 		for (let i = 0; i < nCoins; i++) {
// 			const coin = new Coin(this.world, this.game, this.refs, this, this.scene());
// 			coin.angle = -(i * 0.02);
// 			coin.distance = d + Math.cos(i * 0.5) * amplitude;
// 			coin.position.y = -this.world.seaRadius + Math.sin(coin.angle) * coin.distance;
// 			coin.position.x = Math.cos(coin.angle) * coin.distance;
// 			this.add(coin);
// 		}
// 		this.game.statistics.coinsSpawned += nCoins;
// 	}
// }
