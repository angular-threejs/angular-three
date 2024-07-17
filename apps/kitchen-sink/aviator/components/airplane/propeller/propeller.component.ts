// import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, ViewChild, inject } from '@angular/core';
// import { NgtArgs, injectNgtRef, type NgtBeforeRenderEvent } from 'angular-three-old';
// import { GameService } from '../../../services/game.service';
// import { Colors } from '../../../utils/colors';
//
// @Component({
// 	selector: 'app-propeller',
// 	standalone: true,
// 	templateUrl: './propeller.component.html',
// 	imports: [NgtArgs],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class Propeller {
// 	Math = Math;
// 	Colors = Colors;
//
// 	bladeGeometryRef = injectNgtRef<THREE.BoxGeometry>();
//
// 	private game = inject(GameService);
//
// 	@ViewChild('propellerGeometry') set geometry({ nativeElement }: ElementRef<THREE.BoxGeometry>) {
// 		nativeElement.attributes['position'].array[4 * 3 + 1] -= 5;
// 		nativeElement.attributes['position'].array[4 * 3 + 2] += 5;
// 		nativeElement.attributes['position'].array[5 * 3 + 1] -= 5;
// 		nativeElement.attributes['position'].array[5 * 3 + 2] -= 5;
// 		nativeElement.attributes['position'].array[6 * 3 + 1] += 5;
// 		nativeElement.attributes['position'].array[6 * 3 + 2] += 5;
// 		nativeElement.attributes['position'].array[7 * 3 + 1] += 5;
// 		nativeElement.attributes['position'].array[7 * 3 + 2] -= 5;
// 	}
//
// 	onPropellerBeforeRender(event: NgtBeforeRenderEvent<THREE.Mesh>) {
// 		event.object.rotation.x += 0.1 + this.game.planeSpeed * event.state.delta * 1000 * 0.005;
// 	}
// }
