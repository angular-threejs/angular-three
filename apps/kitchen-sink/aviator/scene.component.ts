// import { CUSTOM_ELEMENTS_SCHEMA, Component, afterNextRender, inject } from '@angular/core';
// import { NgtArgs, injectBeforeRender, injectNgtStore } from 'angular-three-old';
// import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
// import * as THREE from 'three';
// import { Airplane } from './components/airplane/airplane.component';
// import { Lights } from './components/lights/lights.component';
// import { Sea } from './components/sea/sea.component';
// import { Sky } from './components/sky/sky.component';
// import { CollectibleService } from './services/collectible.service';
// import { GameService } from './services/game.service';
// import { RefsService } from './services/refs.service';
// import { WorldService } from './services/world.service';
//
// @Component({
// 	standalone: true,
// 	templateUrl: './scene.component.html',
// 	imports: [NgtArgs, Lights, Airplane, Sea, Sky, NgtsOrbitControls],
// 	providers: [RefsService, CollectibleService],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class AviatorScene {
// 	private world = inject(WorldService);
// 	private collectibles = inject(CollectibleService);
// 	game = inject(GameService);
//
// 	private store = injectNgtStore();
// 	camera = this.store.select('camera');
//
// 	constructor() {
// 		afterNextRender(() => {
// 			const camera = this.camera();
// 			camera.position.set(0, this.world.planeDefaultHeight, 200);
// 			camera.setRotationFromEuler(new THREE.Euler(0, 0, 0));
// 			camera.updateProjectionMatrix();
// 		});
//
// 		injectBeforeRender(({ delta }) => {
// 			this.game.distance += this.game.speed * delta * 1000 * this.world.ratioSpeedDistance;
// 			this.game.baseSpeed += (this.game.targetBaseSpeed - this.game.baseSpeed) * delta * 1000 * 0.02;
// 			this.game.speed = this.game.baseSpeed * this.game.planeSpeed;
//
// 			if (
// 				Math.floor(this.game.distance) % this.world.distanceForCoinsSpawn == 1 &&
// 				Math.floor(this.game.distance) > this.game.coinLastSpawn
// 			) {
// 				this.game.coinLastSpawn = Math.floor(this.game.distance);
// 				this.collectibles.spawnCoins();
// 			}
//
// 			this.collectibles.tick(delta);
// 		});
// 	}
// }
