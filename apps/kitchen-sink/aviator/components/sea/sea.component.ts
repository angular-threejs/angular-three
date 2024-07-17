// import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, inject } from '@angular/core';
// import { NgtArgs, checkUpdate, type NgtAfterAttach, type NgtBeforeRenderEvent } from 'angular-three-old';
// import * as THREE from 'three';
// import { GameService } from '../../services/game.service';
// import { WorldService } from '../../services/world.service';
// import { COLOR_SEA_LEVEL } from '../../utils/colors';
//
// @Component({
// 	selector: 'app-sea',
// 	standalone: true,
// 	templateUrl: './sea.component.html',
// 	imports: [NgtArgs],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class Sea {
// 	@Input() isStatic = false;
//
// 	COLOR_SEA_LEVEL = COLOR_SEA_LEVEL;
//
// 	world = inject(WorldService);
// 	game = inject(GameService);
//
// 	waves: Array<{ x: number; y: number; z: number; ang: number; amp: number; speed: number }> = [];
//
// 	onAfterSeaAttach({ node }: NgtAfterAttach<THREE.CylinderGeometry>) {
// 		node.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
// 		const arr = node.attributes['position'].array;
// 		for (let i = 0; i < arr.length / 3; i++) {
// 			this.waves.push({
// 				x: arr[i * 3 + 0],
// 				y: arr[i * 3 + 1],
// 				z: arr[i * 3 + 2],
// 				ang: Math.random() * Math.PI * 2,
// 				amp: this.world.wavesMinAmp + Math.random() * (this.world.wavesMaxAmp - this.world.wavesMinAmp),
// 				speed: this.world.wavesMinSpeed + Math.random() * (this.world.wavesMaxSpeed - this.world.wavesMinSpeed),
// 			});
// 		}
// 	}
//
// 	onSeaBeforeRender({ object, state: { delta } }: NgtBeforeRenderEvent<THREE.Mesh>) {
// 		if (!this.isStatic) {
// 			object.rotation.z += this.game.speed * delta * 1000;
// 			if (object.rotation.z > 2 * Math.PI) {
// 				object.rotation.z -= 2 * Math.PI;
// 			}
// 			const arr = object.geometry.attributes['position'].array;
// 			for (let i = 0; i < arr.length / 3; i++) {
// 				const wave = this.waves[i];
// 				arr[i * 3 + 0] = wave.x + Math.cos(wave.ang) * wave.amp;
// 				arr[i * 3 + 1] = wave.y + Math.sin(wave.ang) * wave.amp;
// 				wave.ang += wave.speed * delta * 1000;
// 			}
// 			checkUpdate(object.geometry.attributes['position']);
// 		}
// 	}
// }
