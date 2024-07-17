// import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, inject } from '@angular/core';
// import { NgtArgs, type NgtAfterAttach, type NgtBeforeRenderEvent } from 'angular-three-old';
// import { Repeat } from 'ngxtension/repeat';
// import * as THREE from 'three';
// import { GameService } from '../../../services/game.service';
// import { Colors } from '../../../utils/colors';
//
// @Component({
// 	selector: 'app-pilot',
// 	standalone: true,
// 	templateUrl: './pilot.component.html',
// 	imports: [NgtArgs, Repeat],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class Pilot {
// 	Colors = Colors;
//
// 	Math = Math;
//
// 	angleHairs = 0;
//
// 	@Input() position = [0, 0, 0];
//
// 	private game = inject(GameService);
//
// 	onAfterHairAttach({ node }: NgtAfterAttach<THREE.BoxGeometry>) {
// 		node.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1));
// 	}
//
// 	onAfterSideAttach({ node }: NgtAfterAttach<THREE.BoxGeometry>) {
// 		node.applyMatrix4(new THREE.Matrix4().makeTranslation(-6, 0, 0));
// 	}
//
// 	onHairsBeforeRender({ object, state: { delta } }: NgtBeforeRenderEvent<THREE.Object3D>) {
// 		const children = object.children;
// 		for (let i = 0; i < children.length; i++) {
// 			const child = children[i];
// 			child.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25;
// 		}
//
// 		this.angleHairs += this.game.speed * delta * 1000 * 40;
// 	}
// }
