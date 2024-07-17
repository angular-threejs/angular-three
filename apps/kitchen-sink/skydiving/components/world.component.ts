// import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
// import { NgtArgs } from 'angular-three-old';
// import { injectNgtsTextureLoader } from 'angular-three-soba-old/loaders';
// import * as THREE from 'three';
//
// @Component({
// 	selector: 'app-world',
// 	standalone: true,
// 	template: `
// 		<ngt-mesh>
// 			<ngt-sphere-geometry *args="[5, 60, 60]" />
// 			<ngt-mesh-basic-material [toneMapped]="false" [map]="skyTexture()" [side]="BackSide" />
// 		</ngt-mesh>
// 	`,
// 	imports: [NgtArgs],
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class World {
// 	BackSide = THREE.BackSide;
// 	skyTexture = injectNgtsTextureLoader(() => 'assets/sky-texture.jpg');
// }
