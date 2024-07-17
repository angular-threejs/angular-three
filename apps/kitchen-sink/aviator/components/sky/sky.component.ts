// import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
// import { NgtArgs, type NgtBeforeRenderEvent } from 'angular-three-old';
// import { Repeat } from 'ngxtension/repeat';
// import { GameService } from '../../services/game.service';
// import { WorldService } from '../../services/world.service';
// import { Cloud } from './cloud/cloud.component';
//
// @Component({
// 	selector: 'app-sky',
// 	standalone: true,
// 	templateUrl: './sky.component.html',
// 	imports: [NgtArgs, Cloud, Repeat],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class Sky {
// 	Math = Math;
//
// 	count = 20;
// 	stepAngle = (Math.PI * 2) / this.count;
//
// 	world = inject(WorldService);
// 	game = inject(GameService);
// 	heightFactor = this.world.seaRadius + 150 + Math.random() * 200;
//
// 	onAfterCloudAttach(cloud: THREE.Object3D, i: number) {
// 		cloud.position.set(
// 			Math.cos(this.stepAngle * i) * this.heightFactor,
// 			Math.sin(this.stepAngle * i) * this.heightFactor,
// 			-300 - Math.random() * 500,
// 		);
// 		cloud.rotation.set(0, 0, this.stepAngle * i + Math.PI / 2);
// 		cloud.scale.setScalar(1 + Math.random() * 2);
// 	}
//
// 	onSkyBeforeRender({ object, state: { delta } }: NgtBeforeRenderEvent<THREE.Object3D>) {
// 		object.rotation.z += this.game.speed * delta * 1000;
// 	}
// }
