// import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild, inject } from '@angular/core';
// import { NgtArgs, type NgtBeforeRenderEvent } from 'angular-three-old';
// import * as THREE from 'three';
// import { GameService } from '../../services/game.service';
// import { RefsService } from '../../services/refs.service';
// import { WorldService } from '../../services/world.service';
// import { Colors } from '../../utils/colors';
// import { makeTetrahedron } from '../../utils/make-tetrahedron';
// import { normalize } from '../../utils/normalize';
// import { Pilot } from './pilot/pilot.component';
// import { Propeller } from './propeller/propeller.component';
// import { Tire } from './tire/tire.component';
// import { Wheel } from './wheel/wheel.component';
//
// const frontUR = [40, 25, -25];
// const frontUL = [40, 25, 25];
// const frontLR = [40, -25, -25];
// const frontLL = [40, -25, 25];
// const backUR = [-40, 15, -5];
// const backUL = [-40, 15, 5];
// const backLR = [-40, 5, -5];
// const backLL = [-40, 5, 5];
//
// @Component({
// 	selector: 'app-airplane',
// 	standalone: true,
// 	templateUrl: './airplane.component.html',
// 	imports: [NgtArgs, Propeller, Wheel, Tire, Pilot],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class Airplane {
// 	Colors = Colors;
//
// 	DoubleSide = THREE.DoubleSide;
//
// 	cabinVertices = new Float32Array(
// 		makeTetrahedron(frontUL, frontUR, frontLL, frontLR) // front
// 			.concat(makeTetrahedron(backUL, backUR, backLL, backLR)) // back
// 			.concat(makeTetrahedron(backUR, backLR, frontUR, frontLR)) // side
// 			.concat(makeTetrahedron(backUL, backLL, frontUL, frontLL)) // side
// 			.concat(makeTetrahedron(frontUL, backUL, frontUR, backUR)) // top
// 			.concat(makeTetrahedron(frontLL, backLL, frontLR, backLR)), // bottom
// 	);
//
// 	@ViewChild('suspensionGeometry') set suspensionGeometry({ nativeElement }: ElementRef<THREE.BoxGeometry>) {
// 		nativeElement.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10, 0));
// 	}
//
// 	world = inject(WorldService);
// 	game = inject(GameService);
// 	refs = inject(RefsService);
//
// 	constructor() {
// 		console.log(this.world);
// 	}
//
// 	onAirplaneBeforeRender({ object, state: { pointer, delta } }: NgtBeforeRenderEvent<THREE.Object3D>) {
// 		if (this.game.status === 'playing') {
// 			this.game.planeSpeed = normalize(pointer.x, -0.5, 0.5, this.world.planeMinSpeed, this.world.planeMaxSpeed);
// 			let targetX = normalize(pointer.x, -1, 1, -this.world.planeAmpWidth * 0.7, -this.world.planeAmpWidth);
// 			let targetY = normalize(
// 				pointer.y,
// 				-0.75,
// 				0.75,
// 				this.world.planeDefaultHeight - this.world.planeAmpHeight,
// 				this.world.planeDefaultHeight + this.world.planeAmpHeight,
// 			);
//
// 			this.game.planeCollisionDisplacementX += this.game.planeCollisionSpeedX;
// 			targetX += this.game.planeCollisionDisplacementX;
//
// 			this.game.planeCollisionDisplacementY += this.game.planeCollisionSpeedY;
// 			targetY += this.game.planeCollisionDisplacementY;
//
// 			object.position.x += (targetX - object.position.x) * delta * 1000 * this.world.planeMoveSensivity;
// 			object.position.y += (targetY - object.position.y) * delta * 1000 * this.world.planeMoveSensivity;
//
// 			object.rotation.x = (object.position.y - targetY) * delta * 1000 * this.world.planeRotZSensivity;
// 			object.rotation.z = (targetY - object.position.y) * delta * 1000 * this.world.planeRotXSensivity;
// 		}
//
// 		this.game.planeCollisionSpeedX += (0 - this.game.planeCollisionSpeedX) * delta * 1000 * 0.03;
// 		this.game.planeCollisionDisplacementX += (0 - this.game.planeCollisionDisplacementX) * delta * 1000 * 0.01;
// 		this.game.planeCollisionSpeedY += (0 - this.game.planeCollisionSpeedY) * delta * 1000 * 0.03;
// 		this.game.planeCollisionDisplacementY += (0 - this.game.planeCollisionDisplacementY) * delta * 1000 * 0.01;
// 	}
// }
