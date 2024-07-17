// import { CUSTOM_ELEMENTS_SCHEMA, Component, computed } from '@angular/core';
// import { NgtArgs, injectBeforeRender, injectNgtRef, injectNgtStore } from 'angular-three-old';
// import { NgtsInstance, NgtsInstances, PositionMesh } from 'angular-three-soba-old/performances';
// import { NgtsSobaContent } from 'angular-three-soba-old/utils';
// import { Repeat } from 'ngxtension/repeat';
// import * as THREE from 'three';
//
// @Component({
// 	selector: 'app-wind-shape',
// 	standalone: true,
// 	template: `
// 		<ngts-instance color="white" [instanceRef]="ref" [position]="randomPosition" />
// 	`,
// 	imports: [NgtsInstance],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class WindShape {
// 	randomPosition = [
// 		THREE.MathUtils.randFloatSpread(8),
// 		THREE.MathUtils.randFloatSpread(5),
// 		THREE.MathUtils.randFloatSpread(8),
// 	];
// 	private v3 = new THREE.Vector3();
// 	private randomSpeed = THREE.MathUtils.randFloat(0.05, 0.5);
//
// 	ref = injectNgtRef<PositionMesh>();
//
// 	private store = injectNgtStore();
// 	private getCurrentViewport = this.store.get('viewport', 'getCurrentViewport');
//
// 	private height = computed(() => this.getCurrentViewport().height);
//
// 	constructor() {
// 		injectBeforeRender(({ camera }) => {
// 			const instance = this.ref.nativeElement;
// 			if (instance) {
// 				const { height: elHeight } = (instance.instance.nativeElement?.geometry as any)['parameters'];
// 				const worldPosition = instance.getWorldPosition(this.v3);
// 				const limitPos = this.height() - (worldPosition.y + elHeight / 2);
// 				if (limitPos < 0) {
// 					instance.position.y = -(this.height() + elHeight / 2);
// 				}
// 				instance.position.y += this.randomSpeed;
// 				instance.rotation.y = camera.rotation.y;
// 			}
// 		});
// 	}
// }
//
// @Component({
// 	selector: 'app-wind-effect',
// 	standalone: true,
// 	template: `
// 		<ngt-group>
// 			<ngts-instances>
// 				<ng-template ngtsSobaContent>
// 					<ngt-plane-geometry *args="[0.0135, 1.2]" />
// 					<ngt-mesh-basic-material
// 						[side]="DoubleSide"
// 						[blending]="AdditiveBlending"
// 						[opacity]="0.15"
// 						[transparent]="true"
// 					/>
// 					<app-wind-shape *ngFor="let i; repeat: 130" />
// 				</ng-template>
// 			</ngts-instances>
// 		</ngt-group>
// 	`,
// 	imports: [NgtsInstances, NgtsSobaContent, NgtArgs, WindShape, Repeat],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class WindEffect {
// 	DoubleSide = THREE.DoubleSide;
// 	AdditiveBlending = THREE.AdditiveBlending;
// }
