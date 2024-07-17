// import { NgIf } from '@angular/common';
// import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, Output } from '@angular/core';
// import { NgtArgs, injectNgtRef, type NgtAfterAttach, type NgtBeforeRenderEvent } from 'angular-three-old';
// import { Repeat } from 'ngxtension/repeat';
// import { Colors } from '../../../utils/colors';
//
// @Component({
// 	selector: 'app-cloud',
// 	standalone: true,
// 	templateUrl: './cloud.component.html',
// 	imports: [NgtArgs, Repeat, NgIf],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class Cloud {
// 	Colors = Colors;
//
// 	count = 3 + Math.floor(Math.random() * 3);
//
// 	@Output() afterAttach = new EventEmitter<THREE.Object3D>();
//
// 	cloudGeometryRef = injectNgtRef<THREE.BoxGeometry>();
//
// 	onAfterMeshAttach({ node }: NgtAfterAttach<THREE.Object3D, THREE.Mesh>, i: number) {
// 		node.position.x = i * 15;
// 		node.position.y = Math.random() * 10;
// 		node.position.z = Math.random() * 10;
// 		node.rotation.y = Math.random() * Math.PI * 2;
// 		node.rotation.z = Math.random() * Math.PI * 2;
// 		const s = 0.1 + Math.random() * 0.9;
// 		node.scale.set(s, s, s);
// 	}
//
// 	onCloudBeforeRender({ object }: NgtBeforeRenderEvent<THREE.Object3D>) {
// 		const children = object.children;
// 		for (let i = 0; i < children.length; i++) {
// 			const child = children[i];
// 			child.rotation.y += Math.random() * 0.002 * (i + 1);
// 			child.rotation.z += Math.random() * 0.005 * (i + 1);
// 		}
// 	}
// }
