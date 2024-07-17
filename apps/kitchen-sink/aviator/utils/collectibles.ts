// import * as THREE from 'three';
// import { CollectibleService } from '../services/collectible.service';
// import { GameService } from '../services/game.service';
// import { RefsService } from '../services/refs.service';
// import { WorldService } from '../services/world.service';
// import { collide } from './collide';
// import { COLOR_COINS } from './colors';
// import { spawnParticles } from './particles';
// import { rotateAroundSea } from './rotate-around-sea';
//
// export interface Collectible extends THREE.Object3D {
// 	angle: number;
// 	distance: number;
// 	tick: (deltaTime: number) => void;
// }
//
// const coinGeom = new THREE.CylinderGeometry(4, 4, 1, 10);
// const coinMat = new THREE.MeshPhongMaterial({
// 	color: COLOR_COINS,
// 	shininess: 1,
// 	specular: 0xffffff,
// 	flatShading: true,
// });
//
// export class Coin extends THREE.Mesh implements Collectible {
// 	angle = 0;
// 	distance = 0;
//
// 	constructor(
// 		private world: WorldService,
// 		private game: GameService,
// 		private refs: RefsService,
// 		private collectibles: CollectibleService,
// 		private scene: THREE.Scene,
// 	) {
// 		super(coinGeom, coinMat);
// 		this.castShadow = true;
// 	}
//
// 	tick(deltaTime: number) {
// 		rotateAroundSea(this, deltaTime, this.game, this.world);
//
// 		this.rotation.z += Math.random() * 0.1;
// 		this.rotation.y += Math.random() * 0.1;
//
// 		if (this.refs.airplane) {
// 			if (collide(this.refs.airplane, this, this.world.coinDistanceTolerance)) {
// 				spawnParticles(this.position.clone(), 5, COLOR_COINS, 0.8, this.scene);
// 				this.game.addCoin();
// 				// 	audioManager.play('coin', { volume: 0.5 });
// 				this.collectibles.remove(this);
// 			} else if (this.angle > Math.PI) {
// 				this.collectibles.remove(this);
// 			}
// 		}
// 	}
// }
