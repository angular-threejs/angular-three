// import { GameService } from '../services/game.service';
// import { WorldService } from '../services/world.service';
//
// export function rotateAroundSea(
// 	object: THREE.Object3D & { angle: number; distance?: number },
// 	deltaTime: number,
// 	game: GameService,
// 	world: WorldService,
// ) {
// 	object.angle += deltaTime * 1000 * game.speed * world.collectiblesSpeed;
// 	if (object.angle > Math.PI * 2) {
// 		object.angle -= Math.PI * 2;
// 	}
// 	object.position.x = Math.cos(object.angle) * (object.distance ?? 1);
// 	object.position.y = -world.seaRadius + Math.sin(object.angle) * (object.distance ?? 1);
// }
